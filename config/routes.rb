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


  end

  resources :products, only: [:index, :show, :create, :update, :destroy]
  resources :orders, only: [:index, :show, :create, :update, :destroy]

  post '/stripe/webhook', to: 'payments#webhook'



end
