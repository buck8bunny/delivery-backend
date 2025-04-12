class Admin::UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :check_admin_role
  before_action :set_user, only: [:show, :update, :destroy]

  # GET /admin/users
  def index
    @users = User.all.order(created_at: :desc)
    
    render json: @users.as_json(
      only: [:id, :name, :email, :role, :created_at],
      methods: [:orders_count]
    )
  end

  # GET /admin/users/:id
  def show
    render json: @user.as_json(
      only: [:id, :name, :email, :role, :created_at, :updated_at],
      methods: [:orders_count],
      include: {
        orders: {
          only: [:id, :status, :total, :created_at]
        }
      }
    )
  end

  # PUT /admin/users/:id
  def update
    if @user.update(user_params)
      render json: @user.as_json(
        only: [:id, :name, :email, :role, :created_at]
      )
    else
      render json: { 
        errors: @user.errors.full_messages,
        message: "Could not update user: #{@user.errors.full_messages.join(', ')}" 
      }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/users/:id
  def destroy
    if @user.id == current_user.id
      render json: { error: "You cannot delete your own account" }, status: :unprocessable_entity
      return
    end
    
    @user.destroy
    head :no_content
  end

  private

  def set_user
    @user = User.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  def user_params
    params.require(:user).permit(:name, :role)
  end

  def check_admin_role
    unless current_user&.admin?
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
end 