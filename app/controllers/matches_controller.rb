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
    @leaderboards = current_user.organizations.includes(:leaderboards).flat_map(&:leaderboards) || []

    # Ensure @leaderboards is not nil
    @leaderboards = [] if @leaderboards.nil?
  end

  # POST /matches
  # Handles form submission to create a new match record
  def create
    @match = Match.new(match_params)
    @match.user1_id = current_user.id # Automatically set the current user as Player 1

    unless valid_opponent?(@match.opponent_id, @match.leaderboard_id)
      flash.now[:alert] = "Invalid opponent selection."
      return render :new
    end

    if @match.save
      redirect_to @match, notice: "Match successfully logged! Awaiting opponent verification."
    else
      flash.now[:alert] = @match.errors.full_messages.to_sentence
      render :new
    end
  end

  # GET /matches/:id
  def show
  end

  # PATCH /matches/:id/verify
  # Allows the opponent to verify the match result
  def verify
    unless current_user.id == @match.opponent_id
      flash[:alert] = "You are not authorized to verify this match."
      return redirect_to root_path
    end

    # Ensure atomic updates for Elo adjustments and verification
    if adjust_elo_ratings(@match)
      @match.update(verified: true)
      flash[:notice] = "Match verified successfully!"
    else
      flash[:alert] = "Elo adjustment failed. Please try again."
    end

    redirect_to @match
  end

  private

  # Strong parameters
  def match_params
    params.require(:match).permit(:opponent_id, :winner_id, :leaderboard_id, :is_draw)
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
    return false unless opponent_id.present? && leaderboard_id.present?

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

    return false unless player1_rating && player2_rating

    # Elo Calculation
    change = calculate_elo_change(player1_rating.rating, player2_rating.rating, match.winner_id, player1.id)

    ActiveRecord::Base.transaction do
      player1_rating.update_columns(rating: player1_rating.rating + change)
      player2_rating.update_columns(rating: player2_rating.rating - change)

      if match.winner_id == player1.id
        player1_rating.increment!(:wins)
        player2_rating.increment!(:losses)
      elsif match.winner_id == player2.id
        player2_rating.increment!(:wins)
        player1_rating.increment!(:losses)
      end

      # Record Elo history
      EloHistory.create!(user_id: player1.id, leaderboard_id: leaderboard.id, elo: player1_rating.rating)
      EloHistory.create!(user_id: player2.id, leaderboard_id: leaderboard.id, elo: player2_rating.rating)
    end

    true
  rescue => e
    Rails.logger.error "Elo adjustment failed: #{e.message}"
    false
  end

  # Elo rating calculation using standard formula
  def expected_score(rating_a, rating_b)
    1.0 / (1.0 + 10**((rating_b - rating_a) / 400.0))
  end

  def calculate_elo_change(rating_a, rating_b, winner_id, player1_id, k_factor = 32)
    if winner_id.nil? # Draw
      return (k_factor * (0.5 - expected_score(rating_a, rating_b))).round
    end

    outcome = winner_id == player1_id ? 1 : 0
    (k_factor * (outcome - expected_score(rating_a, rating_b))).round
  end
end
