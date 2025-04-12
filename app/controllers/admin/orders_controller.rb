class Admin::OrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :check_admin_role
  before_action :set_order, only: [:show, :update, :destroy]

  # GET /admin/orders
  def index
    @orders = Order.includes(:user, order_items: :product)
                   .order(created_at: :desc)
    
    render json: @orders.as_json(
      include: {
        user: {
          only: [:id, :name, :email]
        },
        order_items: {
          include: {
            product: {
              only: [:id, :name, :price]
            }
          },
          only: [:id, :quantity, :price]
        }
      },
      only: [:id, :status, :total, :created_at]
    )
  end

  # GET /admin/orders/:id
  def show
    render json: @order.as_json(
      include: {
        user: {
          only: [:id, :name, :email]
        },
        order_items: {
          include: {
            product: {
              only: [:id, :name, :price]
            }
          },
          only: [:id, :quantity, :price]
        }
      },
      only: [:id, :status, :total, :created_at]
    )
  end

  # PUT /admin/orders/:id
  def update
    Rails.logger.info("Order update params: #{order_params.inspect}")
    
    if @order.update(order_params)
      render json: @order
    else
      Rails.logger.error("Order update failed: #{@order.errors.full_messages}")
      render json: { 
        errors: @order.errors.full_messages,
        message: "Could not update order status: #{@order.errors.full_messages.join(', ')}" 
      }, status: :unprocessable_entity
    end
  end

  # DELETE /admin/orders/:id
  def destroy
    @order.destroy
    head :no_content
  end

  private

  def set_order
    @order = Order.includes(:user, order_items: :product).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Order not found' }, status: :not_found
  end

  def order_params
    params.require(:order).permit(:status)
  end

  def check_admin_role
    unless current_user&.admin?
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
end 