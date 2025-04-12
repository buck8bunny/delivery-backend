# Delivery Application Project Overview

## Project Structure

This project is a full-stack delivery application with two main components:

1. **Backend** - A Ruby on Rails API application
2. **Frontend** - A React Native mobile application built with Expo

## Technology Stack

### Backend
- **Framework**: Ruby on Rails
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication with Devise
- **Payment Processing**: Stripe integration

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **UI Components**: Native components with custom styling

## Core Features

### User Features
- User authentication (login/signup)
- Browse products
- Search and filter products
- Add products to cart
- Checkout with Stripe payment
- View order history
- Track order status
- User profile management

### Admin Features
- Dashboard with key metrics (orders, users, products, revenue)
- Product management (add, edit, delete)
- Order management
- User management

## Data Model

### Core Entities

1. **User**
   - Attributes: name, email, password, role (user/admin)
   - Relationships: has many orders, has many cart items

2. **Product**
   - Attributes: name, description, price, stock, image_url, category
   - Relationships: has many order items, has many cart items

3. **Order**
   - Attributes: status (pending, completed, failed, cancelled), total, payment_intent_id
   - Relationships: belongs to user, has many order items, has many products through order items

4. **OrderItem**
   - Attributes: quantity, price
   - Relationships: belongs to order, belongs to product

5. **CartItem**
   - Attributes: quantity
   - Relationships: belongs to user, belongs to product

## Application Flow

### Customer Flow
1. User logs in or signs up
2. Browses products on the home screen
3. Adds products to cart
4. Proceeds to checkout
5. Completes payment with Stripe
6. Order is created and processed
7. User can view order status in their profile

### Admin Flow
1. Admin logs in
2. Views dashboard with key metrics
3. Manages products (add, edit, delete)
4. Monitors and manages orders
5. Views user information

## API Endpoints

### Authentication
- POST /auth/login - User login
- POST /auth/signup - User registration
- GET /auth/validate - Validate token

### Products
- GET /products - List all products
- GET /products/:id - Get product details
- POST /products - Create product (admin)
- PUT /products/:id - Update product (admin)
- DELETE /products/:id - Delete product (admin)

### Cart
- GET /cart_items - Get user's cart
- POST /cart_items - Add item to cart
- PUT /cart_items/:id - Update cart item
- DELETE /cart_items/:id - Remove item from cart

### Orders
- GET /orders - List user's orders
- GET /orders/:id - Get order details
- POST /orders - Create new order
- PUT /orders/:id - Update order
- DELETE /orders/:id - Cancel order
- POST /orders/:id/cancel - Cancel pending order

### Admin
- GET /admin/stats - Get dashboard statistics
- GET /admin/orders - List all orders (admin)
- GET /admin/users - List all users (admin)

## Frontend Structure

### Main User Screens
- Login/Signup screens
- Home screen (product listing)
- Product detail screen
- Cart screen
- Checkout screen
- Orders history screen
- Profile screen

### Admin Screens
- Admin dashboard
- Product management screens
- Order management screens
- User management screens

## Security Features
- JWT-based authentication
- Token blacklisting for logout
- Role-based authorization
- Secure payment processing with Stripe

## Development Environment
- The backend runs on Ruby on Rails with PostgreSQL
- The frontend is built with React Native and Expo
- API communication is handled via RESTful endpoints

This application provides a complete solution for online delivery businesses, with both customer-facing features and administrative tools for managing the platform. 