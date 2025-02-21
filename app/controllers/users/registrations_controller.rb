class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  skip_before_action :authenticate_user!, only: [:create]

  def create
    Rails.logger.info "Creating user: #{params[:user][:email]}"
    
    build_resource(sign_up_params)

    if resource.save
      render json: {
        status: 'success',
        message: 'User created successfully',
        data: resource
      }, status: :created
    else
      error_message = resource.errors.full_messages.join(", ")
      render json: {
        status: 'error',
        message: error_message, # Например, "Email has already been taken"
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # Экшен для изменения имени пользователя
  def update_name
    user = current_user
    if user.update(name: params[:name])
      render json: { success: true, message: "Имя успешно обновлено" }
    else
      render json: { success: false, message: "Ошибка при обновлении имени" }, status: :unprocessable_entity
    end
  end

  # Экшен для изменения почты
  def update_email
    user = current_user
    if user.valid_password?(params[:password]) && user.update(email: params[:email])
      render json: { success: true, message: "Почта успешно обновлена" }
    else
      Rails.logger.error("Ошибка при обновлении почты: #{user.errors.full_messages}")
      render json: { success: false, message: "Неверный пароль или ошибка при обновлении почты" }, status: :unprocessable_entity
    end
    
  end

  private

  def sign_up_params
    params.require(:user).permit(:email, :password, :password_confirmation, :name)
  end
end
