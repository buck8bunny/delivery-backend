# app/controllers/cart_items_controller.rb
class CartItemsController < ApplicationController
  before_action :authenticate_user!

  # Добавить товар в корзину
  def create
    product = Product.find(params[:product_id])
    
    # Проверяем наличие товара
    if params[:quantity].to_i > product.stock
      render json: { 
        status: 'error', 
        message: "Not enough items in stock. Available: #{product.stock}" 
      }, status: :unprocessable_entity
      return
    end

    # Получаем текущего пользователя, который должен быть связан с товаром
    user = current_user

    # Обновляем количество товара в корзине для данного пользователя
    CartItem.update_quantity(user, product, params[:quantity].to_i)

    render json: { status: 'success', message: 'Item added to cart' }
  end

  # Обновить количество товара в корзине
  def update
    cart_item = current_user.cart_items.find(params[:id])
    requested_quantity = params[:quantity].to_i

    # Проверяем наличие товара
    if requested_quantity > cart_item.product.stock
      render json: { 
        status: 'error', 
        message: "Not enough items in stock. Available: #{cart_item.product.stock}",
        available_stock: cart_item.product.stock
      }, status: :unprocessable_entity
      return
    end

    if cart_item.update(quantity: requested_quantity)
      render json: { 
        status: 'success', 
        message: 'Quantity updated', 
        cart_item: cart_item,
        available_stock: cart_item.product.stock
      }
    else
      render json: { 
        status: 'error', 
        message: 'Failed to update quantity',
        errors: cart_item.errors.full_messages 
      }, status: :unprocessable_entity
    end
  end

  # Получить товары в корзине
  def index
    Rails.logger.info "Current user: #{current_user.id}"  # Логируем пользователя
    cart_items = current_user.cart_items.includes(:product)
    render json: cart_items.as_json(
      include: { 
        product: { 
          methods: [:image_url],
          only: [:id, :name, :price, :stock]
        }
      }
    )
  end
  

  # Удалить товар из корзины
  def destroy
    cart_item = current_user.cart_items.find(params[:id])
    cart_item.destroy
    render json: { status: 'success', message: 'Item removed from cart' }
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


