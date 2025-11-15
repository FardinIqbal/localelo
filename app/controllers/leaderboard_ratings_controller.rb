class LeaderboardRatingsController < ApplicationController
  before_action :authenticate_user!  # Ensure the user is logged in before accessing any actions
  before_action :set_organization  # Set the organization for the given actions
  before_action :set_leaderboard  # Set the leaderboard for the given actions

  # This controller is now empty as the functionality has been moved to other controllers.
  # The rankings are displayed on the leaderboards#show page.
  # Rating updates are handled by the RatingCalculationJob.
  private

  # Set the organization based on the ID passed in the params
  def set_organization
    @organization = Organization.find(params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end

  # Set the leaderboard for the given organization and leaderboard ID
  def set_leaderboard
    @leaderboard = @organization.leaderboards.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Leaderboard not found."
    redirect_to organization_leaderboard_rankings_path(@organization, @leaderboard)
  end
end
