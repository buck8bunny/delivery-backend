class OrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_order, only: %i[show update destroy]

  # GET /orders
  def index
    @orders = current_user.orders.includes(order_items: :product)
    render json: @orders.as_json(
      include: {
        order_items: {
          include: {
            product: {
              methods: [:image_url],
              only: [:id, :name, :price]
            }
          },
          only: [:id, :quantity, :price]
        }
      },
      only: [:id, :total, :status, :created_at]
    )
  end

  # GET /orders/:id
  def show
    @order = current_user.orders.includes(order_items: :product).find(params[:id])
    render json: @order.as_json(
      include: {
        order_items: {
          include: {
            product: {
              methods: [:image_url],
              only: [:id, :name, :price]
            }
          },
          only: [:id, :quantity, :price]
        }
      },
      only: [:id, :total, :status, :created_at]
    )
  end

  # POST /orders
  def create
    order = current_user.orders.new(order_params.merge(status: 'pending'))

    Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)

    begin
      payment_intent = Stripe::PaymentIntent.create(
        amount: (order.total.to_f.round(2) * 100).to_i,
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
        # Уменьшаем stock для каждого купленного товара
        order.order_items.each do |order_item|
          product = order_item.product
          new_stock = product.stock - order_item.quantity
          product.update(stock: new_stock)
        end

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

  def update_stock
    order = Order.find(params[:id])
    
    if order.paid? && !order.stock_updated
      ActiveRecord::Base.transaction do
        order.order_items.each do |order_item|
          product = order_item.product
          new_stock = product.stock - order_item.quantity
          
          if new_stock >= 0
            product.update!(stock: new_stock)
          else
            raise ActiveRecord::Rollback, "Not enough stock for product #{product.name}"
          end
        end
        
        order.update!(stock_updated: true)
      end
      
      render json: { message: "Stock updated successfully" }
    else
      render json: { error: "Order is not paid or stock already updated" }, 
             status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Order not found" }, status: :not_found
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def cancel
    @order = current_user.orders.find(params[:id])
    
    if @order.pending?
      if @order.update(status: 'cancelled')
        # Возвращаем товары в stock
        @order.order_items.each do |item|
          product = item.product
          product.update(stock: product.stock + item.quantity)
        end
        render json: @order
      else
        render json: { error: 'Unable to cancel order' }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Only pending orders can be cancelled' }, status: :unprocessable_entity
    end
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
    ).tap do |whitelisted|
      # Округляем total до 2 знаков после запятой
      whitelisted[:total] = whitelisted[:total].to_f.round(2) if whitelisted[:total]
      
      # Округляем цены для каждого товара
      if whitelisted[:order_items_attributes]
        whitelisted[:order_items_attributes].each do |item|
          item[:price] = item[:price].to_f.round(2) if item[:price]
        end
      end
    end
  end
end
