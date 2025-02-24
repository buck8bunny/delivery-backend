class OrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_order, only: %i[show update destroy]

  # GET /orders
  def index
    orders = current_user.orders.includes(:order_items, :products)
    render json: orders, include: [:order_items, :products]
  end

  # GET /orders/:id
  def show
    render json: @order, include: [:order_items, :products]
  end

  # POST /orders
  def create
    Rails.logger.info "Creating order with params: #{order_params.inspect}"
    order = current_user.orders.new(order_params.merge(status: 'pending'))
  
    Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)
  
    begin
      payment_intent = Stripe::PaymentIntent.create({
        amount: (order.total * 100).to_i, # Конвертация в центы
        currency: 'usd',
        metadata: { order_id: order.id, user_id: current_user.id }
      })
    
      Rails.logger.info "Payment intent created: #{payment_intent.inspect}"
    
      order.payment_intent_id = payment_intent.id
    
      if order.save
        render json: { order: order, client_secret: payment_intent.client_secret }, status: :created
      else
        Rails.logger.error "Order save failed: #{order.errors.full_messages}"
        render json: { errors: order.errors.full_messages }, status: :unprocessable_entity
      end
    rescue Stripe::StripeError => e
      Rails.logger.error "Stripe error: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
  

  # PATCH/PUT /orders/:id
  def update
    if @order.update(order_params)
      render json: @order
    else
      render json: { errors: @order.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /orders/:id
  def destroy
    @order.destroy
    head :no_content
  end

  private

  def set_order
    @order = current_user.orders.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Order not found' }, status: :not_found
  end

  def order_params
    params.require(:order).permit(:status, :total, order_items_attributes: [:product_id, :quantity, :price])
  end
end
