# app/controllers/dashboard_controller.rb
class DashboardController < ApplicationController
  before_action :authenticate_user!

  def show
    @user = current_user
    @organizations = current_user.organizations.includes(:leaderboards)
    @recent_matches = Match.where("user1_id = ? OR opponent_id = ?", @user.id, @user.id).order(created_at: :desc).limit(10)
  end
end
