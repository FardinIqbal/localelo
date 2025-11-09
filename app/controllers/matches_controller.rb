class MatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match, only: [:show, :destroy]
  before_action :load_leaderboards_and_users, only: [:new, :create]
  before_action :authorize_match_management!, only: [:destroy]

  # GET /matches
  # Lists matches the current user has participated in
  def index
    @matches = current_user.matches
                           .includes(:user1, :opponent, leaderboard: :organization)
                           .recent
                           .page(params[:page])
                           .per(20)

    respond_to do |format|
      format.html
      format.json { render json: @matches }
    end
  end

  # GET /matches/recent
  # Returns recent activity for polling (for dashboard)
  def recent
    scope = params[:scope] == "mine" ? :mine : :all
    @recent_matches = scope == :mine ? current_user.matches.recent.limit(10) : Match.recent.limit(10)

    respond_to do |format|
      format.turbo_stream do
        render partial: "dashboard/recent_match_list",
               locals: { matches: @recent_matches },
               formats: [:html] # ← Force use of .html.erb template
      end
      format.html { head :not_acceptable }
      format.json { render json: @recent_matches }
    end
  end


  # GET /matches/new
  # Form for logging a new match
  def new
    @match = Match.new(leaderboard_id: params[:leaderboard_id], opponent_id: params[:opponent_id])

    # Recently faced opponents for quick selection
    @recent_opponents = User.where.not(id: current_user.id)
                            .joins("LEFT JOIN matches ON users.id = matches.opponent_id OR users.id = matches.user1_id")
                            .where("matches.user1_id = ? OR matches.opponent_id = ?", current_user.id, current_user.id)
                            .distinct
                            .limit(5)

    # Preload users from leaderboard (if selected)
    if params[:leaderboard_id].present?
      @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])
      @users = @leaderboard&.users&.where.not(id: current_user.id)
    end
  end

  # GET /matches/update_opponents
  # Turbo action: Update opponent list based on leaderboard
  def update_opponents
    @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])

    if @leaderboard.nil?
      render turbo_stream: turbo_stream.replace("opponent_selection", "<p class='text-red-500'>❌ Leaderboard not found.</p>")
      return
    end

    @opponents = @leaderboard.users.where.not(id: current_user.id)

    if @opponents.empty?
      render turbo_stream: turbo_stream.replace("opponent_selection", "<p class='text-yellow-500'>⚠️ No opponents available.</p>")
      return
    end

    render turbo_stream: turbo_stream.replace(
      "opponent_selection",
      partial: "matches/opponent_selection",
      locals: { opponents: @opponents }
    )
  end

  # POST /matches
  # Creates a match and immediately records the result
  def create
    @match_form = MatchForm.new(match_params.merge(user1_id: current_user.id))

    if (match = @match_form.save)
      logger.info "[MATCH] Logged match #{match.id} by user #{current_user.id}"
      respond_to do |format|
        format.html { redirect_to matches_path, notice: "Match successfully logged!" }
        format.json { render json: match, status: :created }
      end
    else
      respond_to do |format|
        format.html do
          flash.now[:error] = @match_form.errors.full_messages.to_sentence
          render :new, status: :unprocessable_entity
        end
        format.json { render json: @match_form.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /matches/:id
  # Show a match record (optional for audit/debug)
  def show
    respond_to do |format|
      format.html
      format.json { render json: @match }
    end
  end

  # DELETE /matches/:id
  # Allows either participant (or an admin) to remove an incorrect match
  def destroy
    logger.info "[MATCH] Match #{@match.id} removed by user #{current_user.id}"
    @match.destroy

    respond_to do |format|
      format.turbo_stream { head :ok }
      format.html { redirect_to matches_path, notice: "Match removed." }
      format.json { head :no_content }
    end
  end

  private

  def match_params
    params.require(:match).permit(:leaderboard_id, :opponent_id, :winner_id, :is_draw)
  end

  def set_match
    @match = Match.includes(:user1, :opponent, leaderboard: :organization).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    logger.warn "[MATCH] Match not found: #{params[:id]}"
    respond_to do |format|
      format.html do
        flash[:error] = "Match not found."
        redirect_to matches_path
      end
      format.json { render json: { error: "Match not found" }, status: :not_found }
    end
  end

  def load_leaderboards_and_users
    @leaderboards = current_user.organizations.includes(:leaderboards).flat_map(&:leaderboards).uniq

    if params[:match] && params[:match][:leaderboard_id].present?
      @users = Leaderboard.find(params[:match][:leaderboard_id]).users.where.not(id: current_user.id)
    elsif params[:leaderboard_id].present?
      @users = Leaderboard.find(params[:leaderboard_id]).users.where.not(id: current_user.id)
    else
      @users = []
    end
  end

  def authorize_match_management!
    return if [@match.user1_id, @match.opponent_id].include?(current_user.id)
    return if @match.leaderboard.organization.admin?(current_user)

    logger.warn "[MATCH] Unauthorized match removal attempt on match #{@match.id} by user #{current_user.id}"
    respond_to do |format|
      format.html do
        flash[:error] = "You don't have permission to manage this match."
        redirect_to @match
      end
      format.turbo_stream { head :unauthorized }
      format.json { render json: { error: "Unauthorized" }, status: :unauthorized }
    end
    false
  end
end
