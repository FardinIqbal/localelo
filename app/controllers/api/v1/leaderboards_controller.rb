class Api::V1::LeaderboardsController < ApplicationController
  before_action :set_leaderboard

  def show
    render json: {
      id: @leaderboard.id,
      name: @leaderboard.name,
      sport_type: {
        id: @leaderboard.sport_type.id,
        name: @leaderboard.sport_type.name,
        metadata_template: @leaderboard.sport_type.metadata_template || {}
      }
    }, status: :ok
  end

  private

  def set_leaderboard
    @leaderboard = Leaderboard.includes(:sport_type).find_by(id: params[:id])
    return render json: { error: "Leaderboard not found" }, status: :not_found if @leaderboard.nil?
  end
end
