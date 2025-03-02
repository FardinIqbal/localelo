Rails.application.routes.draw do
  devise_for :users

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Root path (homepage)
  authenticated :user do
    root to: "gyms#index", as: :authenticated_root
  end
  root "home#index"

  # Gym-related routes
  resources :gyms, only: [:index, :show, :new, :create] do
    member do
      get 'dashboard', to: 'gyms#dashboard', as: 'dashboard'
    end
  end


  # Player and match routes
  resources :players, only: [:show]

  # Match Requests routes (create, accept, decline)
  resources :match_requests, only: [:create] do
    member do
      post :accept
      post :decline
    end
  end

  resources :notifications, only: [] do
    member do
      patch :mark_as_read
    end
  end

  # Matches routes
  resources :matches, only: [:index, :create]

  # API namespace
  namespace :api do
    namespace :v1 do
      resources :matches, only: [:index, :create]
      resources :players, only: [:index, :show]
    end
  end
end
