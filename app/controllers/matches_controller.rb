class MatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match, only: [:show, :destroy]
  before_action :load_leaderboards_and_profiles, only: [:new, :create]
  before_action :authorize_match_management!, only: [:destroy]

  # GET /matches
  # Lists matches the current user has participated in
  def index
    @matches = current_user.matches
                           .includes(profile1: :user, opponent_profile: :user, leaderboard: :organization)
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
    @match = Match.new(leaderboard_id: params[:leaderboard_id])
    @selected_opponent_profile_id = params[:opponent_profile_id]

    # Recently faced opponents for quick selection
    @recent_opponents = recent_opponent_profiles

    # Preload users from leaderboard (if selected)
    if params[:leaderboard_id].present?
      @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])
      @profiles = available_profiles_for_leaderboard(@leaderboard)
      @current_profile = current_user.profile_for(@leaderboard.organization_id) if @leaderboard
    end

    @profiles ||= []
  end

  # GET /matches/update_opponents
  # Turbo action: Update opponent list based on leaderboard
  def update_opponents
    @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])

    if @leaderboard.nil?
      render turbo_stream: turbo_stream.replace("opponent_selection", "<p class='text-red-500'>❌ Leaderboard not found.</p>")
      return
    end

    @opponents = available_profiles_for_leaderboard(@leaderboard)

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
    @leaderboard = Leaderboard.find_by(id: match_params[:leaderboard_id])

    unless @leaderboard
      handle_missing_leaderboard and return
    end

    profile1 = current_user.profile_for(@leaderboard.organization_id)

    unless profile1
      handle_missing_profile and return
    end

    @match_form = MatchForm.new(match_params.merge(profile1_id: profile1.id))

    if (match = @match_form.save)
      logger.info "[MATCH] Logged match #{match.id} by user #{current_user.id}"
      respond_to do |format|
        format.html { redirect_to matches_path, notice: "Match successfully logged!" }
        format.json { render json: match, status: :created }
      end
    else
      form_attributes = match_params
      @match = Match.new(leaderboard_id: form_attributes[:leaderboard_id])
      @selected_opponent_profile_id = form_attributes[:opponent_profile_id]
      @leaderboard = Leaderboard.find_by(id: form_attributes[:leaderboard_id])
      @recent_opponents = recent_opponent_profiles
      @profiles = available_profiles_for_leaderboard(@leaderboard)
      @current_profile = current_user.profile_for(@leaderboard.organization_id) if @leaderboard

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
    params.require(:match).permit(:leaderboard_id, :opponent_profile_id, :winner_profile_id, :is_draw)
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

  def load_leaderboards_and_profiles
    @leaderboards = current_user.organizations.includes(:leaderboards).flat_map(&:leaderboards).uniq
    @user_profiles_by_org = current_user.profiles.map { |profile| [profile.organization_id, profile.id] }.to_h

    if params[:match] && params[:match][:leaderboard_id].present?
      leaderboard = Leaderboard.find_by(id: params[:match][:leaderboard_id])
      @profiles = available_profiles_for_leaderboard(leaderboard)
      @current_profile = current_user.profile_for(leaderboard.organization_id) if leaderboard
    elsif params[:leaderboard_id].present?
      leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])
      @profiles = available_profiles_for_leaderboard(leaderboard)
      @current_profile = current_user.profile_for(leaderboard.organization_id) if leaderboard
    else
      @profiles = []
    end

    @user_profiles_by_org ||= {}
  end

  def authorize_match_management!
    profile_ids = current_user.profile_ids
    return if profile_ids.include?(@match.profile1_id) || profile_ids.include?(@match.opponent_profile_id)
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

  def recent_opponent_profiles
    profiles = current_user.profiles.includes(:organization)
    return [] if profiles.empty?

    profile_ids = profiles.map(&:id)

    Match.involving_profiles(profile_ids)
         .includes(profile1: :user, opponent_profile: :user)
         .order(created_at: :desc)
         .limit(5)
         .map do |match|
           if profile_ids.include?(match.profile1_id)
             match.opponent_profile
           else
             match.profile1
           end
         end
         .compact
         .uniq(&:id)
  end

  def available_profiles_for_leaderboard(leaderboard)
    return [] unless leaderboard

    profile = current_user.profile_for(leaderboard.organization_id)
    leaderboard.profiles.where.not(id: profile&.id).distinct
  end

  def handle_missing_leaderboard
    respond_to do |format|
      format.html do
        flash[:error] = "Leaderboard not found."
        redirect_to new_match_path
      end
      format.json { render json: { error: "Leaderboard not found" }, status: :not_found }
    end
  end

  def handle_missing_profile
    respond_to do |format|
      format.html do
        flash[:error] = "You do not have a profile in this organization."
        redirect_to new_match_path
      end
      format.json { render json: { error: "Profile not found for organization" }, status: :unprocessable_entity }
    end
  end
end
