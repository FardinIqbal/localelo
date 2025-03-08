class DashboardController < ApplicationController
  before_action :authenticate_user!

  def show
    @user = current_user
    @organizations = current_user.organizations.preload(:leaderboards)
    @recent_matches = Match.where(user1_id: @user.id).or(Match.where(opponent_id: @user.id))
                           .order(created_at: :desc)
                           .limit(10)
  end
end
