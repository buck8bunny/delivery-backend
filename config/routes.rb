Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

  # Оборачиваем маршрут refresh в devise_scope
  devise_scope :user do
    post '/refresh', to: 'users/sessions#refresh'
  end
end
