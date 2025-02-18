class Users::SessionsController < Devise::SessionsController
  respond_to :json

  # Логин с генерацией токена
  def create
    super do |resource|
      if resource.persisted?
        token = Warden::JWTAuth::UserEncoder.new.call(resource, :user, nil)[0]
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

  # Обновление токена с использованием refresh token
  def refresh
    refresh_token = params[:refresh_token]
    begin
      decoded_token = JWT.decode(refresh_token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      user_id = decoded_token[0]["sub"]
      user = User.find(user_id)
      
      # Генерация нового токена
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)[0]
      
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
