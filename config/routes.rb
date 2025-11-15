Rails.application.routes.draw do
  # Devise authentication routes
  devise_for :users, controllers: { sessions: 'devise/sessions' }

  # Public home page for unauthenticated visitors
  unauthenticated do
    root to: "home#index", as: :unauthenticated_root
  end

  # Dashboard for signed-in users
  authenticated :user do
    root to: "dashboard#show", as: :authenticated_root
  end

  # Profile routes
  resources :profiles, only: [:show, :edit, :update]

  # Global search
  get "/search", to: "searches#show"

  # Account-level pages (e.g., organization membership overview)
  get "/account/my-organizations", to: "account_organizations#index", as: :account_organizations
  get "dashboard/performance", to: "dashboard#performance", as: :dashboard_performance

  # Core organization routes with nested leaderboards
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

  # Membership management
  resources :organization_memberships, only: [:index, :create, :destroy]

  # User stats and performance history
  resources :leaderboard_ratings, only: [:index, :show, :update]
  resources :elo_history, only: [:index, :show]

  # Match system (includes dynamic opponent updates)
  resources :matches do
    collection do
      get :recent                      # Recent match activity (for dashboard)
      get :update_opponents           # Dynamic Turbo update when changing leaderboard
    end
  end

  # API namespace for JSON access (e.g., mobile or client apps)
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
          get :update_opponents
        end
      end

      resources :users, only: [:index, :show]
    end
  end
end
