Rails.application.routes.draw do
  devise_for :users

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Root path (Homepage)
  authenticated :user do
    root to: "users#show", as: :authenticated_root  # Redirects logged-in users to their profile
  end
  root "home#index"

  # User profile routes
  resources :users, only: [:show, :edit, :update]  # Profiles for each user

  # Gym-related routes
  resources :gyms, only: [:index, :show, :new, :create]
  resources :gyms do
    get 'members', on: :member  # Adds /gyms/:id/members route
  end

  # Matches & Match History
  resources :matches, only: [:index, :new, :create]
  get "matches/:id", to: "matches#show", as: "match"  # View individual match details

  # API Routes
  namespace :api do
    namespace :v1 do
      resources :matches, only: [:index, :create]
      resources :users, only: [:index, :show]  # Using `users` instead of `players`
    end
  end
end
