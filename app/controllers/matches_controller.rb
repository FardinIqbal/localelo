class MatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match, only: [:show, :verify]
  before_action :load_leaderboards_and_users, only: [:new, :create]
  before_action :load_recent_opponents, only: [:new]
  before_action :authorize_match_verification!, only: [:verify]

  # GET /matches
  def index
    @matches = current_user.matches
                           .includes(:user1, :opponent, :leaderboard => :organization)
                           .recent
                           .page(params[:page])
                           .per(20)

    respond_to do |format|
      format.html
      format.json { render json: @matches }
    end
  end

  # GET /matches/recent
  def recent
    @matches = Match.includes(:user1, :opponent, :leaderboard => :organization)
                    .recent
                    .limit(10)

    respond_to do |format|
      format.html
      format.json { render json: @matches }
    end
  end

  # GET /matches/new
  def new
    @match = Match.new(leaderboard_id: params[:leaderboard_id], opponent_id: params[:opponent_id])

    # Pre-select leaderboard if provided
    if params[:leaderboard_id].present?
      @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])
      @users = LeaderboardUsersQuery.new(params[:leaderboard_id], current_user.id).call if @leaderboard
    end
  end

  # POST /matches
  def create
    @match_form = MatchForm.new(match_params.merge(user1_id: current_user.id))

    respond_to do |format|
      if @match_form.save
        format.html { redirect_to matches_path, notice: "Match successfully logged!" }
        format.json { render json: @match_form.match, status: :created }
      else
        format.html do
          flash.now[:error] = @match_form.errors.full_messages.to_sentence
          render :new, status: :unprocessable_entity
        end
        format.json { render json: @match_form.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /matches/:id
  def show
    respond_to do |format|
      format.html
      format.json { render json: @match }
    end
  end

  # PATCH /matches/:id/verify
  def verify
    respond_to do |format|
      if @match.update(verified: true)
        # Trigger Elo recalculation
        @match.send(:adjust_ratings)

        format.html { redirect_to @match, notice: "Match verified and ratings updated!" }
        format.json { render json: @match, status: :ok }
      else
        format.html { redirect_to @match, alert: "Failed to verify match." }
        format.json { render json: @match.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def match_params
    params.require(:match).permit(:leaderboard_id, :opponent_id, :winner_id, :is_draw)
  end

  def set_match
    @match = Match.includes(:user1, :opponent, leaderboard: :organization).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    respond_to do |format|
      format.html do
        flash[:error] = "Match not found."
        redirect_to matches_path
      end
      format.json { render json: { error: "Match not found" }, status: :not_found }
    end
  end

  def load_leaderboards_and_users
    # Cache this query for better performance
    @leaderboards = Rails.cache.fetch("user_#{current_user.id}_leaderboards", expires_in: 1.hour) do
      current_user.organizations
                  .includes(:leaderboards)
                  .flat_map(&:leaderboards)
                  .uniq
    end || []

    # Only load users if a leaderboard is selected
    if params[:match] && params[:match][:leaderboard_id].present?
      leaderboard_id = params[:match][:leaderboard_id]
      @users = LeaderboardUsersQuery.new(leaderboard_id, current_user.id).call
    elsif params[:leaderboard_id].present?
      @users = LeaderboardUsersQuery.new(params[:leaderboard_id], current_user.id).call
    else
      @users = []
    end
  end

  def load_recent_opponents
    @recent_opponents = User.joins(:matches)
                            .where("matches.user1_id = ? OR matches.opponent_id = ?", current_user.id, current_user.id)
                            .where.not(id: current_user.id)
                            .distinct
                            .limit(5)
  end

  def authorize_match_verification!
    unless @match.opponent_id == current_user.id ||
      @match.leaderboard.organization.admin?(current_user)
      respond_to do |format|
        format.html do
          flash[:error] = "You don't have permission to verify this match."
          redirect_to @match
        end
        format.json { render json: { error: "Unauthorized" }, status: :unauthorized }
      end
    end
  end
  def load_recent_opponents
    @recent_opponents = User.joins("LEFT JOIN matches ON users.id = matches.opponent_id OR users.id = matches.user1_id")
                            .where("matches.user1_id = ? OR matches.opponent_id = ?", current_user.id, current_user.id)
                            .where.not(id: current_user.id)
                            .distinct
                            .limit(5)
  end

end
