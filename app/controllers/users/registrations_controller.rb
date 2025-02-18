class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  def create
    Rails.logger.info "Creating user: #{params[:user][:email]}"
    super do |resource|
      if resource.persisted?
        # Убираем генерирование токена при регистрации
        render json: {
          status: 'success',
          message: 'User created successfully',
          data: resource
        }, status: :created
        return
      end
    end
  end
end
