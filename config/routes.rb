Rails.application.routes.draw do
  devise_for :users

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Root path (redirect to dashboard if logged in, otherwise to login)
  root "home#index"

  # Gym-related routes (each gym has its own page)
  resources :gyms, only: [:show] do
    member do
      get 'dashboard', to: 'gyms#dashboard', as: 'dashboard'  # This defines gym_dashboard_path
    end
  end

  # Player and match routes
  resources :players, only: [:show]

  # Match Requests routes (create, accept, decline)
  resources :match_requests, only: [:create] do
    member do
      post :accept  # Change from PATCH to POST to match the view
      post :decline # Change from PATCH to POST to match the view
    end
  end

  # Matches routes (you can keep this if you want to manage match details separately)
  resources :matches, only: [:index, :create]

  # API namespace
  namespace :api do
    namespace :v1 do
      resources :matches, only: [:index, :create]
      resources :players, only: [:index, :show]
    end
  end
end