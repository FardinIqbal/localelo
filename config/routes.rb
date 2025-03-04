Rails.application.routes.draw do
  devise_for :users

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Root path (Homepage)
  authenticated :user do
    root to: "users#show", as: :authenticated_root  # Redirects logged-in users to their profile
  end
  root "home#index"  # Unauthenticated users go to the homepage

  # User profile routes
  resources :users, only: [:show, :edit, :update]
  get "profile", to: "users#show", as: "user_profile"  # `/profile` shows the current user's profile

  # Gym-related routes
  resources :gyms, only: [:index, :show, :new, :create] do
    get 'members', on: :member  # Adds /gyms/:id/members route
  end

  # Matches & Match History
  resources :matches, only: [:index, :new, :create, :show]

  # API Routes
  namespace :api do
    namespace :v1 do
      resources :matches, only: [:index, :create]
      resources :users, only: [:index, :show]
    end
  end
end
