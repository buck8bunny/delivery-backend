class ProductsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show]
  before_action :set_product, only: %i[show update destroy]

  # GET /products
  def index
    products = Product.all
    render json: products
  end

  # GET /products/:id
  def show
    render json: @product
  end

  # POST /products
  def create
    product = Product.new(product_params)
    
    if params[:image] # Если передано изображение
      uploaded_file = params[:image]
      file_path = Rails.root.join("public/uploads", uploaded_file.original_filename)
      
      File.open(file_path, "wb") do |file|
        file.write(uploaded_file.read)
      end
      
      product.image_url = "/uploads/#{uploaded_file.original_filename}"
    end
  
    if product.save
      render json: product, status: :created
    else
      render json: product.errors, status: :unprocessable_entity
    end
  end
  
  # PATCH/PUT /products/:id
  def update
    if @product.update(product_params)
      render json: @product
    else
      render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /products/:id
  def destroy
    @product.destroy
    head :no_content
  end

  private

  def set_product
    @product = Product.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Product not found' }, status: :not_found
  end

  def product_params
    params.require(:product).permit(:name, :description, :price, :stock, :category)
  end
end
