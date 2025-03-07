Rails.application.routes.draw do
  devise_for :users, controllers: { sessions: 'devise/sessions' }
  # Health check route
  get "up" => "rails/health#show", as: :rails_health_check

  # Home Page (Unauthenticated Users)
  root "home#index"

  # Authenticated Users Dashboard
  authenticated :user do
    root to: "users#dashboard", as: :authenticated_root
  end

  # User Profile
  resources :users, only: [:show, :edit, :update]
  get "profile", to: "users#show", as: "user_profile"

  # Organizations
  resources :organizations do
    member do
      get "members"
      post "join"
      post "approve_member"
    end

    resources :leaderboards, only: [:index, :show, :create] do
      member do
        get "rankings"
      end
    end
  end

  # Matches & Match History
  resources :matches do
    collection do
      get "recent"
      post "bulk_log"
    end
  end

  # API Routes
  namespace :api do
    namespace :v1 do
      resources :organizations, only: [:index, :show, :create] do
        get :members, on: :member
        post :join, on: :member
        post :approve_member, on: :member
      end

      resources :leaderboards, only: [:index, :show, :create] do
        get :rankings, on: :member
      end

      resources :matches, only: [:index, :create, :show] do
        collection do
          get :recent
          post :bulk_log
        end
      end

      resources :users, only: [:index, :show]
    end
  end
end
