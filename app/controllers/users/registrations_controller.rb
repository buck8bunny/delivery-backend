class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  skip_before_action :authenticate_user!, only: [:create]

  def profile
    if current_user
      render json: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        created_at: current_user.created_at,
        updated_at: current_user.updated_at,
        orders_count: current_user.orders.count
      }
    else
      render json: { 
        error: "User not found",
        message: "Could not find user information"
      }, status: :not_found
    end
  end

  def create
    build_resource(sign_up_params)

    resource.save
    if resource.persisted?
      token = JWT.encode(
        { user_id: resource.id },
        Rails.application.credentials.secret_key_base
      )

      render json: {
        status: 'success',
        message: 'Registration successful',
        user: {
          id: resource.id,
          email: resource.email,
          name: resource.name
        },
        token: token
      }, status: :created
    else
      clean_up_passwords resource
      render json: {
        status: 'error',
        message: resource.errors.full_messages.first,
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update_name
    if current_user.update(name: params[:name])
      render json: { 
        success: true, 
        message: "Name updated successfully",
        name: current_user.name
      }
    else
      render json: { 
        success: false, 
        message: current_user.errors.full_messages.first,
        errors: current_user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update_email
    unless current_user.valid_password?(params[:password])
      render json: { 
        success: false, 
        message: "Invalid current password",
        errors: ["Invalid password"]
      }, status: :unprocessable_entity
      return
    end

    if current_user.update(email: params[:email])
      render json: { 
        success: true, 
        message: "Email updated successfully",
        email: current_user.email
      }
    else
      render json: { 
        success: false, 
        message: current_user.errors.full_messages.first,
        errors: current_user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  protected

  def respond_with(resource, _opts = {})
    if resource.persisted?
      token = JWT.encode(
        { user_id: resource.id },
        Rails.application.credentials.secret_key_base
      )

      render json: {
        status: 'success',
        message: 'Registration successful',
        user: {
          id: resource.id,
          email: resource.email,
          name: resource.name
        },
        token: token
      }
    else
      render json: {
        status: 'error',
        message: resource.errors.full_messages.first,
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def respond_to_on_destroy
    head :no_content
  end

  private

  def sign_up_params
    params.require(:user).permit(:email, :password, :name)
  end
end
