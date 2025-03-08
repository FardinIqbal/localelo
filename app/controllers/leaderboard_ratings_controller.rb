class LeaderboardRatingsController < ApplicationController
  before_action :authenticate_user!  # Ensure the user is logged in before accessing any actions
  before_action :set_organization  # Set the organization for the given actions
  before_action :set_leaderboard  # Set the leaderboard for the given actions

  # GET /organizations/:organization_id/leaderboards/:id/rankings
  # This action will show the leaderboard and the rankings of all users in the given organization
  def rankings
    # Fetch all the users in this organization and order them by their Elo rating
    @rankings = @leaderboard.users.order(elo_rating: :desc)  # Elo rating in descending order
  end

  # GET /organizations/:organization_id/leaderboards/:id/rankings/:user_id
  # This action shows an individual user's ranking in the organization
  def user_ranking
    @user = User.find(params[:user_id])

    # Fetch the user's position in the leaderboard of the given organization
    @user_ranking = @leaderboard.users.order(elo_rating: :desc).find_index(@user) + 1  # Position in the leaderboard (1-based index)

    # If the user is not part of the leaderboard, we show an appropriate message
    unless @user_ranking
      flash[:alert] = "User is not part of this leaderboard."
      redirect_to organization_leaderboard_rankings_path(@organization, @leaderboard)
    end
  end

  # PATCH /organizations/:organization_id/leaderboards/:id/update_rating
  # This action updates the Elo rating for a user after a match has been completed
  def update_rating
    # Find the user whose rating needs to be updated
    @user = @leaderboard.users.find(params[:user_id])

    # Assuming we receive a new Elo rating for the user after a match
    new_elo = params[:elo_rating].to_i

    # Update the user's Elo rating
    if @user.update(elo_rating: new_elo)
      flash[:notice] = "User's Elo rating updated successfully."
      redirect_to organization_leaderboard_rankings_path(@organization, @leaderboard)
    else
      flash.now[:alert] = "Failed to update Elo rating."
      render :rankings  # Re-render the rankings page in case of failure
    end
  end

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
