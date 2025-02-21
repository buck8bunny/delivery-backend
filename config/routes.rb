Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

  # Оборачиваем маршрут refresh в devise_scope
  devise_scope :user do
    post '/refresh', to: 'users/sessions#refresh'
    post '/payments', to: 'payments#create'

    post '/confirm_payment', to: 'payments#confirm_payment'
    
     # ✅ Добавляем проверку токена внутрь devise_scope
    get '/auth/validate', to: 'users/sessions#validate_token'
    # Изминение имени
    patch '/users/update_name', to: 'users/registrations#update_name'
    # Изминение имени
    patch '/users/update_email', to: 'users/registrations#update_email'
    # Изминение имени
    patch '/users/password/update', to: 'users/passwords#update'

  end

  resources :products, only: [:index, :show, :create, :update, :destroy]
  resources :orders, only: [:index, :show, :create, :update, :destroy]
  resources :cart_items, only: [:index, :create, :update, :destroy]
  post '/stripe/webhook', to: 'payments#webhook'




end
