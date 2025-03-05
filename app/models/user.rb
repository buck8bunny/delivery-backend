class User < ApplicationRecord
  
  devise :database_authenticatable, :registerable, :recoverable, 
  :rememberable, :validatable, :jwt_authenticatable, 
  jwt_revocation_strategy: JwtBlacklist

before_create :set_jti
private

def set_jti
  self.jti ||= SecureRandom.uuid
end

    # Метод для генерации refresh токена
    def generate_refresh_token(user)
      payload = { sub: user.id, jti: user.jti, exp: 1.month.from_now.to_i }
      JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
    end
    
  has_many :orders, dependent: :destroy
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  validates :role, presence: true, inclusion: { in: %w[user admin] }
  
  def admin?
    role == 'admin'
  end

  def user?
    role == 'user'
  end
end
