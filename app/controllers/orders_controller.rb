class OrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_order, only: %i[show update destroy]

  # GET /orders
  def index
    @orders = current_user.orders
      .includes(order_items: :product)
      .order(created_at: :desc)
    
    render json: @orders, include: {
      order_items: {
        include: {
          product: {
            only: [:name]
          }
        },
        only: [:quantity, :price, :product_id]
      }
    }
  end

  # GET /orders/:id
  def show
    render json: @order, include: [:order_items, :products]
  end

  # POST /orders
  def create
    order = current_user.orders.new(order_params.merge(status: 'pending'))

    Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)

    begin
      payment_intent = Stripe::PaymentIntent.create(
        amount: (order.total.to_f * 100).to_i,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true
        },
        metadata: { 
          order_id: order.id,
          user_id: current_user.id 
        }
      )
      
      order.payment_intent_id = payment_intent.id

      if order.save
        render json: { 
          order: order,
          payment_intent_id: payment_intent.id,
          client_secret: payment_intent.client_secret 
        }, status: :created
      else
        render json: { errors: order.errors.full_messages }, status: :unprocessable_entity
      end
    rescue Stripe::StripeError => e
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
    params.require(:order).permit(
      :total,
      order_items_attributes: [:product_id, :quantity, :price]
    )
  end
end
