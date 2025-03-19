Rails.application.routes.draw do
  devise_for :users, controllers: { sessions: 'devise/sessions' }

  # Home Page (for unauthenticated users)
  unauthenticated do
    root to: "home#index", as: :unauthenticated_root
  end

  # Authenticated Users Dashboard
  authenticated :user do
    root to: "dashboard#show", as: :authenticated_root
  end

  # User Profile
  resources :users, only: [:show, :edit, :update]
  get "profile", to: "users#show", as: "user_profile"

  # Organizations
  resources :organizations do
    member do
      get :members
      post :join
      patch :approve_member
      delete :leave
    end

    resources :leaderboards, except: [:destroy] do
      member do
        get :rankings
      end
    end
  end

  # Organization Memberships
  resources :organization_memberships, only: [:index, :create, :destroy]

  # Leaderboard Ratings
  resources :leaderboard_ratings, only: [:index, :show, :update]

  # Elo History
  resources :elo_history, only: [:index, :show]

  # Matches (Removed bulk_log)
  resources :matches, except: [:destroy] do
    collection do
      get :recent
    end
    member do
      patch :verify
    end
  end

  # API Routes (Consider keeping only if used)
  namespace :api do
    namespace :v1 do
      resources :organizations, only: [:index, :show, :create] do
        member do
          get :members
          post :join
          patch :approve_member
          delete :leave
        end

        resources :leaderboards, only: [:index, :show, :create] do
          member do
            get :rankings
          end
        end
      end

      resources :organization_memberships, only: [:index, :create, :destroy]
      resources :leaderboard_ratings, only: [:index, :show, :update]
      resources :elo_history, only: [:index, :show]

      resources :matches, only: [:index, :create, :show] do
        collection do
          get :recent
        end
        member do
          patch :verify
        end
      end

      resources :users, only: [:index, :show]
    end
  end
end
