class Users::PasswordsController < Devise::PasswordsController
  before_action :authenticate_user!
  
  # Обновление пароля через текущий пароль и новый пароль
  def update
    user = current_user

    # Проверяем текущий пароль с помощью valid_password?
    if user.valid_password?(params[:current_password])
      if user.update(password: params[:new_password], password_confirmation: params[:new_password_confirmation])
        render json: { success: true, message: "Пароль успешно обновлен" }
      else
        render json: { success: false, message: "Ошибка при обновлении пароля" }, status: :unprocessable_entity
      end
    else
      render json: { success: false, message: "Неверный текущий пароль" }, status: :unprocessable_entity
    end
  end

  # Остальные методы можно оставить закомментированными или удалить, если не используете их
  # def new
  #   super
  # end

  # def create
  #   super
  # end

  # def edit
  #   super
  # end

  # def update
  #   super
  # end
end
