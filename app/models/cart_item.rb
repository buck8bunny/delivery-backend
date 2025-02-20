class CartItem < ApplicationRecord
  belongs_to :user
  belongs_to :product
  
  validates :quantity, numericality: { greater_than: 0 }

  # Обновление количества товара в корзине
  def self.update_quantity(user, product, quantity)
    cart_item = user.cart_items.find_or_initialize_by(product: product)
    cart_item.quantity = quantity
    cart_item.save
  end
end
