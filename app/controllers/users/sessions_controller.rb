class Users::SessionsController < ApplicationController
  respond_to :json
  skip_before_action :authenticate_user!

  # Логин с генерацией токена
  def create
    user = User.find_by(email: sign_in_params[:email])

    if user&.valid_password?(sign_in_params[:password])
      token = JWT.encode({ user_id: user.id }, Rails.application.credentials.secret_key_base)
      render json: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }, status: :ok
    else
      render json: { error: 'Неверный email или пароль' }, status: :unauthorized
    end
  end
  
  def validate_token
    token = request.headers['Authorization']&.split(' ')&.last
  
    if token.present?
      begin
        decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
        user_id = decoded_token[0]["sub"]
        user = User.find_by(id: user_id, jti: decoded_token[0]["jti"]) # Проверяем jti
  
        if user
          render json: { 
            valid: true, 
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            } 
          }, status: :ok
        else
          render json: { valid: false, message: "Invalid token" }, status: :unauthorized
        end
      rescue JWT::DecodeError
        render json: { valid: false, message: "Invalid token" }, status: :unauthorized
      end
    else
      render json: { valid: false, message: "No token provided" }, status: :unauthorized
    end
  end
  


  # Обновление токена с использованием refresh token
  def refresh
    refresh_token = params[:refresh_token]
    begin
      decoded_token = JWT.decode(refresh_token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      user_id = decoded_token[0]["sub"]
      user = User.find(user_id)
      
      # Проверяем, совпадает ли jti
      if decoded_token[0]["jti"] != user.jti
        return render json: { status: 'error', message: 'Invalid refresh token' }, status: :unauthorized
      end
  
      # Генерация нового токена с jti
      payload = { sub: user.id, jti: user.jti }
      token = JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
  
      render json: {
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token: token
      }, status: :ok
    rescue JWT::DecodeError
      render json: { status: 'error', message: 'Invalid refresh token' }, status: :unauthorized
    end
  end
  

  private

  def sign_in_params
    params.require(:user).permit(:email, :password)
  end

  # Функция для генерации refresh token
  def generate_refresh_token(user)
    JWT.encode(
      { sub: user.id, exp: 1.month.from_now.to_i }, 
      Rails.application.credentials.secret_key_base, 
      'HS256'
    )
  end
end
