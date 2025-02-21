class Users::SessionsController < Devise::SessionsController
  respond_to :json
  skip_before_action :authenticate_user!

  # Логин с генерацией токена
  def create
    super do |resource|
      if resource.persisted?
        resource.update!(jti: SecureRandom.uuid) # Обновляем jti
        
        payload = { sub: resource.id, jti: resource.jti } # Добавляем jti в токен
        token = JWT.encode(payload, Rails.application.credentials.secret_key_base, 'HS256')
  
        refresh_token = generate_refresh_token(resource)
        render json: {
          status: 'success',
          message: 'Logged in successfully',
          data: resource,
          token: token,
          refresh_token: refresh_token
        }, status: :ok
        return
      end
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
          render json: { valid: true, user: user }, status: :ok
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
        data: user,
        token: token
      }, status: :ok
    rescue JWT::DecodeError
      render json: { status: 'error', message: 'Invalid refresh token' }, status: :unauthorized
    end
  end
  

  private

  # Функция для генерации refresh token
  def generate_refresh_token(user)
    JWT.encode(
      { sub: user.id, exp: 1.month.from_now.to_i }, 
      Rails.application.credentials.secret_key_base, 
      'HS256'
    )
  end
end
