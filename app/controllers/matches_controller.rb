class MatchesController < ApplicationController
  # Ensure users are signed in before they can access these actions
  before_action :authenticate_user!
  before_action :set_match, only: [:show, :verify]
  before_action :authorize_match_participant!, only: [:show, :verify]

  # GET /matches/new
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

  # POST /matches
  # Handles form submission to create a new match record
  def create
    @match = Match.new(match_params)
    @match.user1_id = current_user.id # Automatically set the current user as Player 1

    # Ensure opponent is valid (belongs to the same leaderboard)
    unless valid_opponent?(@match.opponent_id, @match.leaderboard_id)
      flash.now[:alert] = "Invalid opponent selection."
      return render :new
    end

    # Save the match record
    if @match.save
      # If additional metadata is provided, store it using MatchMetadata
      if params[:match][:metadata].present?
        @match.create_match_metadata(data: params[:match][:metadata])
      end

      # Redirect to the match details page with a success message
      redirect_to @match, notice: "Match successfully logged! Awaiting opponent verification."
    else
      # If validation fails, show error messages and render the form again
      flash.now[:alert] = @match.errors.full_messages.to_sentence
      render :new
    end
  end

  # GET /matches/:id
  # Shows match details
  def show
  end

  # PATCH /matches/:id/verify
  # Allows the opponent to verify the match result
  def verify
    unless current_user.id == @match.opponent_id
      flash[:alert] = "You are not authorized to verify this match."
      return redirect_to root_path
    end

    # Update match as verified and adjust Elo ratings
    ActiveRecord::Base.transaction do
      adjust_elo_ratings(@match)
      @match.update!(verified: true)
    end

    flash[:notice] = "Match verified successfully!"
    redirect_to @match
  end

  private

  # Strong parameters to prevent mass assignment vulnerabilities
  def match_params
    params.require(:match).permit(:opponent_id, :winner_id, :leaderboard_id, :is_draw, :submission)
  end

  # Finds match by ID before actions that require it
  def set_match
    @match = Match.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Match not found."
    redirect_to matches_path
  end

  # Ensures only match participants can view or verify the match
  def authorize_match_participant!
    unless current_user.id.in?([@match.user1_id, @match.opponent_id])
      flash[:alert] = "You are not authorized to view this match."
      redirect_to root_path
    end
  end

  # Checks if the opponent is in the same leaderboard
  def valid_opponent?(opponent_id, leaderboard_id)
    User.joins(:leaderboard_ratings)
        .where(leaderboard_ratings: { leaderboard_id: leaderboard_id })
        .exists?(id: opponent_id)
  end

  # Adjusts Elo ratings based on match results
  def adjust_elo_ratings(match)
    player1 = match.user1
    player2 = match.opponent
    leaderboard = match.leaderboard

    player1_rating = leaderboard.leaderboard_ratings.find_by(user_id: player1.id)
    player2_rating = leaderboard.leaderboard_ratings.find_by(user_id: player2.id)

    # Skip if ratings are missing (should never happen)
    return unless player1_rating && player2_rating

    # Elo update logic
    if match.is_draw
      change = 10 # Draw results in small adjustments
      player1_rating.increment!(:rating, change)
      player2_rating.increment!(:rating, change)
    else
      winner_rating, loser_rating = match.winner_id == player1.id ? [player1_rating, player2_rating] : [player2_rating, player1_rating]

      # Elo rating adjustment (basic implementation)
      change = 20 # Modify this based on Elo calculation logic
      winner_rating.increment!(:rating, change)
      loser_rating.decrement!(:rating, change)

      winner_rating.increment!(:wins)
      loser_rating.increment!(:losses)
    end

    # Record Elo history
    EloHistory.create!(user_id: player1.id, leaderboard_id: leaderboard.id, elo: player1_rating.rating)
    EloHistory.create!(user_id: player2.id, leaderboard_id: leaderboard.id, elo: player2_rating.rating)
  end
end
