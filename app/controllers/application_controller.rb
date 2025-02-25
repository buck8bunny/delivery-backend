class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  def authenticate_user!
    header = request.headers['Authorization']
    if header
      token = header.split(' ').last
      begin
        decoded = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
        @current_user = User.find(decoded[0]['user_id'])
      rescue JWT::DecodeError
        render json: { error: 'Invalid token' }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :unauthorized
      end
    else
      render json: { error: 'Token missing' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
