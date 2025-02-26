class PaymentsController < ApplicationController
  include ActionController::MimeResponds
  respond_to :json
  
  before_action :authenticate_user!, except: [:webhook]

  def create
    begin
      Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)

      amount = params[:amount].to_i
      currency = params[:currency] || 'usd'
      payment_method_id = params[:payment_method_id]

      payment_intent = Stripe::PaymentIntent.create({
        amount: amount,
        currency: currency,
        payment_method: payment_method_id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never" # Отключаем редиректы
        }
      })

      render json: { status: 'success', payment_intent: payment_intent }, status: :ok
    rescue Stripe::CardError => e
      render json: { status: 'error', message: e.message }, status: :unprocessable_entity
    rescue => e
      render json: { status: 'error', message: e.full_message }, status: :internal_server_error
    end
  end

  def confirm_payment
    begin
      payment_intent_id = params[:payment_intent_id]
      order = Order.find_by(payment_intent_id: payment_intent_id)
      
      if order
        order.update!(status: 'paid')
        # Очищаем корзину пользователя
        order.user.cart_items.destroy_all
        
        render json: { status: 'success', message: 'Payment confirmed and cart cleared' }
      else
        render json: { error: 'Order not found' }, status: :not_found
      end
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def payment_sheet
    Rails.logger.info "=== Payment Sheet Start ==="
    Rails.logger.info "User: #{current_user.inspect}"
    
    begin
      Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)

      cart_items = current_user.cart_items.includes(:product)
      amount = cart_items.sum { |item| item.product.price.to_f * item.quantity }
      
      Rails.logger.info "Amount calculated: #{amount}"

      unless amount > 0
        render json: { error: 'Cart is empty' }, status: :unprocessable_entity
        return
      end

      @order = Order.create!(
        user: current_user,
        total: amount,
        status: 'pending',
        order_items_attributes: cart_items.map { |item|
          {
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.price
          }
        }
      )

      customer = Stripe::Customer.create(
        email: current_user.email,
        metadata: {
          user_id: current_user.id.to_s,
          order_id: @order.id.to_s
        }
      )

      ephemeral_key = Stripe::EphemeralKey.create(
        { customer: customer.id },
        { stripe_version: '2020-08-27' }
      )

      payment_intent = Stripe::PaymentIntent.create({
        amount: (amount * 100).to_i,
        currency: 'usd',
        customer: customer.id,
        metadata: {
          order_id: @order.id.to_s,
          user_id: current_user.id.to_s
        },
        automatic_payment_methods: {
          enabled: true
        }
      })

      @order.update(payment_intent_id: payment_intent.id)

      response_data = {
        paymentIntent: payment_intent.client_secret,
        ephemeralKey: ephemeral_key.secret,
        customer: customer.id,
        publishableKey: Rails.application.credentials.dig(:stripe, :publishable_key),
        orderId: @order.id
      }

      Rails.logger.info "Success response prepared"
      render json: response_data, status: :ok

    rescue => e
      Rails.logger.error "Payment Sheet Error: #{e.full_message}"
      @order&.destroy if @order&.persisted?
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def webhook
    Rails.logger.info "=== Webhook received ==="
    
    payload = request.body.read
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    endpoint_secret = Rails.application.credentials.dig(:stripe, :webhook_secret)

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, endpoint_secret
      )

      Rails.logger.info "Event Type: #{event.type}"

      case event.type
      when 'payment_intent.succeeded'
        payment_intent = event.data.object
        Rails.logger.info "Payment Intent ID: #{payment_intent.id}"
        
        order = Order.find_by(payment_intent_id: payment_intent.id)
        
        if order
          Rails.logger.info "Found order: #{order.id}"
          
          # Обновляем stock в транзакции
          ActiveRecord::Base.transaction do
            order.order_items.each do |item|
              product = item.product
              new_stock = product.stock - item.quantity
              
              if new_stock >= 0
                Rails.logger.info "Updating stock for product #{product.id} from #{product.stock} to #{new_stock}"
                product.update!(stock: new_stock)
              else
                Rails.logger.error "Not enough stock for product #{product.id}"
                raise ActiveRecord::Rollback
              end
            end
            
            order.update!(status: 'completed')
            order.user.cart_items.destroy_all
            Rails.logger.info "Order updated and cart cleared"
          end
        else
          Rails.logger.error "Order not found for payment_intent_id: #{payment_intent.id}"
        end

      when 'payment_intent.payment_failed'
        payment_intent = event.data.object
        order = Order.find_by(payment_intent_id: payment_intent.id)
        order&.update!(status: 'failed')
        Rails.logger.info "Payment failed for order: #{order&.id}"

      when 'payment_intent.canceled'
        payment_intent = event.data.object
        order = Order.find_by(payment_intent_id: payment_intent.id)
        order&.update!(status: 'cancelled') if order&.pending?
      end

      render json: { status: 'success' }
    rescue => e
      Rails.logger.error "Webhook Error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: e.message }, status: :bad_request
    end
  end

  def cancel_order
    @order = Order.find(params[:id])
    
    if @order.user_id == current_user.id
      @order.update!(status: 'failed')
      render json: { status: 'success' }
    else
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Order not found' }, status: :not_found
  end

  private

  def handle_stripe_error(error)
    case error
    when Stripe::CardError
      "Card error: #{error.message}"
    when Stripe::InvalidRequestError
      "Invalid request: #{error.message}"
    else
      "Error: #{error.message}"
    end
  end
end
