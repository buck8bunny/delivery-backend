# app/controllers/cart_items_controller.rb
class CartItemsController < ApplicationController
  before_action :authenticate_user!

  # Добавить товар в корзину
  def create
    product = Product.find(params[:product_id])

    # Получаем текущего пользователя, который должен быть связан с товаром
    user = current_user

    # Обновляем количество товара в корзине для данного пользователя
    CartItem.update_quantity(user, product, params[:quantity].to_i)

    render json: { status: 'success', message: 'Товар добавлен в корзину' }
  end

  # Обновить количество товара в корзине
  def update
    cart_item = current_user.cart_items.find(params[:id])

    if cart_item.update(quantity: params[:quantity].to_i)
      render json: { status: 'success', message: 'Количество обновлено', cart_item: cart_item }
    else
      render json: { status: 'error', message: 'Не удалось обновить количество' }, status: :unprocessable_entity
    end
  end

  # Получить товары в корзине
  def index
    Rails.logger.info "Current user: #{current_user.id}"  # Логируем пользователя
    cart_items = current_user.cart_items.includes(:product)
    render json: cart_items.as_json(include: :product)
  end
  

  # Удалить товар из корзины
  def destroy
    cart_item = current_user.cart_items.find(params[:id])
    cart_item.destroy
    render json: { status: 'success', message: 'Товар удалён из корзины' }
  end

   # Получить общую сумму корзины
  def cart_total
    # Получаем все товары из корзины текущего пользователя
    cart_items = current_user.cart_items.includes(:product)

    # Вычисляем общую сумму
    total = cart_items.sum { |item| item.product.price * item.quantity }

    render json: { total: total }, status: :ok
  end
end


