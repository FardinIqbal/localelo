Rails.application.routes.draw do
  devise_for :users

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Root path (redirect to dashboard if logged in, otherwise to login)
  root "home#index"

  # Gym-related routes (each gym has its own page)
  resources :gyms, only: [:show] do
    member do
      get 'dashboard'
    end
  end


  # Player and match routes
  resources :players, only: [:show]
  resources :matches, only: [:index, :create] do
    collection do
      post :create_request
      post :accept_request
      post :decline_request
    end
  end

  # API namespace
  namespace :api do
    namespace :v1 do
      resources :matches, only: [:index, :create]
      resources :players, only: [:index, :show]
    end
  end
end
