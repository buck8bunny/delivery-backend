class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  skip_before_action :authenticate_user!

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

  private

  def sign_up_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end
