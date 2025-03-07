class MatchesController < ApplicationController
  # Ensure users are signed in before they can access these actions
  before_action :authenticate_user!

  # Renders the form to log a new match
  def new
    @match = Match.new

    # Fetch all users except the current user (potential opponents)
    @users = User.where.not(id: current_user.id)

    # Fetch all leaderboards from the organizations the user is part of
    @leaderboards = current_user.organizations.flat_map(&:leaderboards)

    # Fetch sport-specific metadata templates to dynamically generate match details input fields
    @sport_metadata = SportType.all.includes(:metadata_template)
  end

  # Handles form submission to create a new match record
  def create
    @match = Match.new(match_params)
    @match.user1_id = current_user.id # Automatically set the current user as Player 1

    # Save the match record
    if @match.save
      # If additional metadata is provided, store it using MatchMetadata
      if params[:match][:metadata].present?
        @match.create_match_metadata(data: params[:match][:metadata])
      end

      # Redirect to the match details page with a success message
      redirect_to @match, notice: "Match successfully logged!"
    else
      # If validation fails, show error messages and render the form again
      flash.now[:alert] = "Error logging match."
      render :new
    end
  end

  private

  # Strong parameters to prevent mass assignment vulnerabilities
  def match_params
    params.require(:match).permit(:opponent_id, :winner_id, :leaderboard_id)
  end
end
