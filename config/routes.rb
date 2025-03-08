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

  # Fallback root in case of issues
  root to: "home#index"

  # User Profile
  resources :users, only: [:show, :edit, :update]
  get "profile", to: "users#show", as: "user_profile"

  # Organizations
  resources :organizations, param: :slug do
    collection do
      get "my", to: "organizations#my_organizations", as: "my_organizations"
    end

    member do
      get "members"
      post "join"
      patch "approve_member"
      delete "leave"
    end

    # Leaderboards (nested under organizations, using `slug` for organizations)
    resources :leaderboards, only: [:new, :index, :show, :create, :edit, :update, :destroy], param: :id do
      member do
        get "rankings"
      end
    end
  end

  # Leaderboard Ratings
  resources :leaderboard_ratings, only: [:index, :show, :update]

  # Elo History
  resources :elo_history, only: [:index, :show]

  # Matches
  resources :matches do
    collection do
      get "recent"
      post "bulk_log"
    end
    member do
      patch "verify"
    end
  end

  # Linkflairs
  resources :linkflairs, only: [:index, :show]

  # API Routes
  namespace :api do
    namespace :v1 do
      resources :organizations, only: [:index, :show, :create], param: :slug do
        collection do
          get "my", to: "organizations#my_organizations"
        end

        member do
          get :members
          post :join
          patch :approve_member
          delete :leave
        end

        resources :leaderboards, only: [:index, :show, :create], param: :id do
          member do
            get :rankings
          end
        end
      end

      resources :leaderboard_ratings, only: [:index, :show, :update]
      resources :elo_history, only: [:index, :show]

      resources :matches, only: [:index, :create, :show] do
        collection do
          get :recent
          post :bulk_log
        end
        patch :verify, on: :member
      end

      resources :linkflairs, only: [:index, :show]
      resources :users, only: [:index, :show]
    end
  end
end
