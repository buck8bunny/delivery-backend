module Admin
  class ProductsController < ApplicationController
    before_action :authenticate_user!
    before_action :check_admin_role
    before_action :set_product, only: [:show, :update, :destroy]

    def index
      products = Product.all.order(created_at: :desc)
      render json: products
    end

    def show
      render json: @product
    end

    def create
      product = Product.new(product_params)

      if product.save
        render json: product, status: :created
      else
        render json: { 
          error: 'Failed to create product',
          details: product.errors.full_messages 
        }, status: :unprocessable_entity
      end
    end

    def update
      if @product.update(product_params)
        render json: @product
      else
        render json: { 
          error: 'Failed to update product',
          details: @product.errors.full_messages 
        }, status: :unprocessable_entity
      end
    end

    def destroy
      if @product.destroy
        head :no_content
      else
        render json: { 
          error: 'Failed to delete product',
          details: @product.errors.full_messages 
        }, status: :unprocessable_entity
      end
    end

    private

    def set_product
      @product = Product.find(params[:id])
    end

    def product_params
      params.require(:product).permit(:name, :description, :price, :stock, :image_url)
    end

    def check_admin_role
      unless current_user&.admin?
        render json: { error: 'Unauthorized' }, status: :unauthorized
      end
    end
  end
end
