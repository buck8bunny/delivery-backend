class PaymentsController < ApplicationController
  require 'stripe'
  before_action :authenticate_user!

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
      Stripe.api_key = Rails.configuration.stripe[:secret_key]

      payment_intent_id = params[:payment_intent_id]

      # Завершаем платеж
      payment_intent = Stripe::PaymentIntent.retrieve(payment_intent_id)

      # Получаем заказ по payment_intent_id
      order = current_user.orders.find_by(payment_intent_id: payment_intent.id)
      
      # Если заказ найден и платеж прошел успешно
      if order && payment_intent.status == 'succeeded'
        order.update(status: 'paid')  # Обновляем статус заказа на "paid"
      end

      render json: { status: 'success', payment_intent: payment_intent, order: order }, status: :ok
    rescue Stripe::CardError => e
      render json: { status: 'error', message: e.message }, status: :unprocessable_entity
    rescue => e
      render json: { status: 'error', message: e.full_message }, status: :internal_server_error
    end
  end

  
  skip_before_action :authenticate_user!, only: [:webhook]

  def webhook
    payload = request.body.read
    event = nil

    begin
      event = Stripe::Event.construct_from(JSON.parse(payload, symbolize_names: true))
    rescue JSON::ParserError => e
      return head :bad_request
    end

    case event.type
    when 'payment_intent.succeeded'
      payment_intent = event.data.object
      order = Order.find_by(payment_intent_id: payment_intent.id)

      if order
        order.update(status: 'paid')
      end
    end

    head :ok
  end


end
