Rails.application.routes.draw do
  devise_for :users, 
    controllers: {
      sessions: 'users/sessions',
      registrations: 'users/registrations'
    },
    defaults: { format: :json }

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

    post '/payment-sheet', to: 'payments#payment_sheet'

    get '/users/profile', to: 'users/registrations#profile'
  end

  # Перемещаем payment-sheet маршрут за пределы devise_scope
  post '/payment-sheet', to: 'payments#payment_sheet'

  resources :products, only: [:index, :show, :create, :update, :destroy]
  resources :orders, only: [:index, :show, :create, :update, :destroy]
  resources :cart_items, only: [:index, :create, :update, :destroy]

  get 'cart_total', to: 'cart_items#cart_total'

  # Обновляем маршрут для webhook, добавляя поддержку GET и POST
  match '/stripe/webhook', to: 'payments#webhook', via: [:get, :post]
  # или
  get '/stripe/webhook', to: 'payments#webhook'
  post '/stripe/webhook', to: 'payments#webhook'

  resources :orders, only: [:create] do
    collection do
      post :confirm_payment
    end
  end

  post '/orders/:id/cancel', to: 'payments#cancel_order'

end
