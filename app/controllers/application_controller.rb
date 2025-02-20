class ApplicationController < ActionController::API
  before_action :authenticate_user!

  # Обработка авторизации через JWT
  def authenticate_user!
    token = request.headers['Authorization'].to_s.split(' ').last
    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      user_id = decoded_token[0]["sub"]
      @current_user = User.find(user_id)
    rescue JWT::DecodeError
      render json: { status: 'error', message: 'Unauthorized' }, status: :unauthorized
    end
  end
end
