class Admin::DashboardController < ApplicationController
  before_action :authenticate_user!
  before_action :check_admin_role

  def stats
    total_orders = Order.count
    total_users = User.count
    total_products = Product.count
    total_revenue = Order.where(status: 'completed').sum(:total)

    render json: {
      total_orders: total_orders,
      total_users: total_users,
      total_products: total_products,
      total_revenue: total_revenue.to_f
    }
  end

  private

  def check_admin_role
    unless current_user&.admin?
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

end
