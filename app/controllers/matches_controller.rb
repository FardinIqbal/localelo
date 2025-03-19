class MatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match, only: [:show]

  # GET /matches/new
  def new
    @match = Match.new

    # Get leaderboards the user belongs to
    @leaderboards = current_user.organizations.includes(:leaderboards).flat_map(&:leaderboards).uniq || []

    # Ensure users are only those in the selected leaderboard, not just in the organization
    @users = User.joins(:leaderboard_ratings)
                 .where(leaderboard_ratings: { leaderboard_id: @leaderboards.map(&:id) })
                 .where.not(id: current_user.id)
                 .distinct

    # Debugging logs
    Rails.logger.info "=== DEBUG: Leaderboards ==="
    Rails.logger.info "Leaderboards: #{@leaderboards.map(&:name)}"
    Rails.logger.info "=== DEBUG: Available Opponents ==="
    Rails.logger.info "Users: #{@users.map(&:username)}"
  end

  # POST /matches
  def create
    @match = Match.new(match_params)
    @match.user1_id = current_user.id

    Rails.logger.info "=== DEBUG: Creating Match ==="
    Rails.logger.info "Params: #{match_params}"
    Rails.logger.info "User1: #{@match.user1_id}, Opponent: #{@match.opponent_id}, Winner: #{@match.winner_id}, Leaderboard: #{@match.leaderboard_id}"

    unless valid_opponent?(@match.opponent_id, @match.leaderboard_id)
      Rails.logger.error "=== DEBUG: Invalid Opponent! ==="
      flash.now[:error] = "Invalid opponent selection. Please choose a valid opponent."
      return render :new, status: :unprocessable_entity
    end

    if @match.save
      Rails.logger.info "=== DEBUG: Match Successfully Saved ==="
      adjust_elo_ratings(@match)
      redirect_to organization_leaderboard_path(@match.leaderboard.organization, @match.leaderboard),
                  notice: "Match successfully logged!"
    else
      Rails.logger.error "=== DEBUG: Match Save Failed ==="
      Rails.logger.error "Errors: #{@match.errors.full_messages}"

      @users = User.joins(:leaderboard_ratings)
                   .where(leaderboard_ratings: { leaderboard_id: @match.leaderboard_id })
                   .where.not(id: current_user.id)
                   .distinct

      @leaderboards = current_user.organizations.includes(:leaderboards).flat_map(&:leaderboards).uniq || []

      flash.now[:error] = @match.errors.full_messages.to_sentence.presence || "An unexpected error occurred."
      render :new, status: :unprocessable_entity
    end
  end

  # GET /matches/:id
  def show; end

  private

  def match_params
    params.require(:match).permit(:leaderboard_id, :opponent_id, :winner_id)
  end

  def set_match
    @match = Match.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:error] = "Match not found."
    redirect_to matches_path
  end

  def valid_opponent?(opponent_id, leaderboard_id)
    return false unless opponent_id.present? && leaderboard_id.present?

    User.joins(:leaderboard_ratings)
        .where(leaderboard_ratings: { leaderboard_id: leaderboard_id })
        .exists?(id: opponent_id)
  end

  def adjust_elo_ratings(match)
    player1 = match.user1
    player2 = match.opponent
    leaderboard = match.leaderboard

    player1_rating = leaderboard.leaderboard_ratings.find_or_create_by(user_id: player1.id) { |r| r.rating = 1500 }
    player2_rating = leaderboard.leaderboard_ratings.find_or_create_by(user_id: player2.id) { |r| r.rating = 1500 }

    change = calculate_elo_change(player1_rating.rating, player2_rating.rating, match.winner_id, player1.id)

    ActiveRecord::Base.transaction do
      if match.winner_id == player1.id
        player1_rating.increment!(:wins)
        player2_rating.increment!(:losses)
        player1_rating.update!(rating: player1_rating.rating + change)
        player2_rating.update!(rating: player2_rating.rating - change)
      else
        player2_rating.increment!(:wins)
        player1_rating.increment!(:losses)
        player2_rating.update!(rating: player2_rating.rating + change)
        player1_rating.update!(rating: player1_rating.rating - change)
      end
    end
  rescue => e
    Rails.logger.error "Elo adjustment failed: #{e.message}"
  end

  def calculate_elo_change(rating_a, rating_b, winner_id, player1_id, k_factor = 32)
    outcome = winner_id == player1_id ? 1 : 0
    (k_factor * (outcome - expected_score(rating_a, rating_b))).round
  end

  def expected_score(rating_a, rating_b)
    1.0 / (1.0 + 10**((rating_b - rating_a) / 400.0))
  end
end
