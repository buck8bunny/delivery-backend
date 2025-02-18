class AuthController < ApplicationController
  def refresh_token
    # Получаем refresh token из запроса
    refresh_token = request.headers['Authorization'].split(' ').last

    user = User.find_by(refresh_token: refresh_token)

    if user && user.refresh_token_valid?  # Проверяем, что refresh token существует и валиден
      # Генерируем новый JWT
      new_jwt_token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)[0]

      render json: { status: 'success', token: new_jwt_token }, status: :ok
    else
      render json: { status: 'error', message: 'Invalid refresh token' }, status: :unauthorized
    end
  end
end
