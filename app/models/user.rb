class User < ApplicationRecord
  
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # devise :database_authenticatable, :registerable,
  #        :recoverable, :rememberable, :validatable
  devise :database_authenticatable, :registerable, :jwt_authenticatable, jwt_revocation_strategy: JwtBlacklist

  

    # Метод для генерации refresh токена
  def generate_refresh_token
    self.refresh_token = SecureRandom.hex(64) # Генерация случайного строкового токена
    save!
  end
  has_many :orders, dependent: :destroy
end
