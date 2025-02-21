class Order < ApplicationRecord
  belongs_to :user
  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items



  accepts_nested_attributes_for :order_items # ✅ Добавляем поддержку вложенных атрибутов

  validates :status, presence: true, inclusion: { in: %w[pending paid shipped completed cancelled] }
  validates :total, numericality: { greater_than_or_equal_to: 0 }
  validates :payment_intent_id, uniqueness: true, allow_nil: true

  def paid?
    status == 'paid'
  end
end
