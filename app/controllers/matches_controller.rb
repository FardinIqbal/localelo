class MatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match, only: [:show, :destroy]
  before_action :load_leaderboards_and_profiles, only: [:new, :create]
  before_action :authorize_match_management!, only: [:destroy]

  # GET /matches
  # Lists matches the current user has participated in
  def index
    @matches = current_user.matches
                           .includes(match_participants: { profile: :user }, leaderboard: :organization)
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
    @recent_matches = if scope == :mine
                        current_user.matches.recent.limit(10)
                      else
                        Match.recent
                             .includes(match_participants: { profile: :user }, leaderboard: :organization)
                             .limit(10)
                      end

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
    @selected_opponent_profile_id = params[:opponent_profile_id] || params.dig(:match, :opponent_profile_id)

    # Recently faced opponents for quick selection
    @recent_opponents = recent_opponent_profiles

    # Preload users from leaderboard (if selected)
    if params[:leaderboard_id].present?
      @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])
      @opponents = available_profiles_for_leaderboard(@leaderboard)
      @current_profile = current_user.profile_for(@leaderboard.organization_id) if @leaderboard
    end

    @opponents ||= []
  end

  # GET /matches/update_opponents
  # Update opponent list based on leaderboard (supports both turbo_stream and JSON)
  def update_opponents
    @leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])

    if @leaderboard.nil?
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("opponent_selection", "<p class='text-red-500'>❌ Leaderboard not found.</p>") }
        format.json { render json: { error: "Leaderboard not found", opponents: [] }, status: :not_found }
      end
      return
    end

    @opponents = available_profiles_for_leaderboard(@leaderboard)

    if @opponents.empty?
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("opponent_selection", "<p class='text-yellow-500'>⚠️ No opponents available.</p>") }
        format.json { render json: { opponents: [] } }
      end
      return
    end

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "opponent_selection",
          partial: "matches/opponent_selection",
          locals: { opponents: @opponents }
        )
      end
      format.json do
        render json: {
          opponents: @opponents.map { |profile| { id: profile.id, username: profile.username } }
        }
      end
    end
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
      @opponents = available_profiles_for_leaderboard(@leaderboard)
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
    logger.info "[MATCH] Match #{@match.id} invalidated by user #{current_user.id}"
    @match.invalidate!

    respond_to do |format|
      format.turbo_stream { head :ok }
      format.html { redirect_to matches_path, notice: "Match invalidated and ratings reversed." }
      format.json { head :no_content }
    end
  end

  private

  def match_params
    params.require(:match).permit(:leaderboard_id, :opponent_profile_id, :winner_profile_id, :is_draw)
  end

  def set_match
    @match = Match.includes(match_participants: { profile: :user }, leaderboard: :organization).find(params[:id])
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

    approved_profiles = current_user.profiles
                                    .joins(:organization_membership)
                                    .merge(OrganizationMembership.approved)
                                    .includes(:organization)
                                    .to_a

    @user_profiles_by_org = approved_profiles.map { |profile| [profile.organization_id.to_s, profile.id] }.to_h

    selected_profile_id = params[:profile_id]
    @current_profile = if selected_profile_id.present?
                         approved_profiles.detect { |profile| profile.id == selected_profile_id.to_i }
                       else
                         approved_profiles.first
                       end
    @current_profile ||= approved_profiles.first

    if params[:match] && params[:match][:leaderboard_id].present?
      leaderboard = Leaderboard.find_by(id: params[:match][:leaderboard_id])
      @opponents = available_profiles_for_leaderboard(leaderboard)
      @current_profile = current_user.profile_for(leaderboard.organization_id) if leaderboard
    elsif params[:leaderboard_id].present?
      leaderboard = Leaderboard.find_by(id: params[:leaderboard_id])
      @opponents = available_profiles_for_leaderboard(leaderboard)
      @current_profile = current_user.profile_for(leaderboard.organization_id) if leaderboard
    else
      @opponents = []
    end

    @user_profiles_by_org ||= {}
  end

  def authorize_match_management!
    if @match.invalidated?
      logger.warn "[MATCH] Attempt to invalidate already invalidated match #{@match.id} by user #{current_user.id}"
      respond_to do |format|
        format.html do
          flash[:error] = "This match has already been invalidated."
          redirect_to matches_path
        end
        format.turbo_stream { head :unprocessable_entity }
        format.json { render json: { error: "Match already invalidated" }, status: :unprocessable_entity }
      end
      return false
    end

    profile_ids = current_user.profile_ids
    return if (@match.participant_profile_ids & profile_ids).any?
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
    profiles = current_user.profiles
                           .joins(:organization_membership)
                           .merge(OrganizationMembership.approved)
                           .includes(:organization)
    return [] if profiles.empty?

    profile_ids = profiles.map(&:id)

    Match.involving_profiles(profile_ids)
         .includes(match_participants: { profile: :user })
         .order(created_at: :desc)
         .limit(5)
         .map do |match|
           participant = match.match_participants.find { |participant| !profile_ids.include?(participant.profile_id) }
           participant&.profile
         end
         .compact
         .uniq { |profile| profile.id }
  end

  def available_profiles_for_leaderboard(leaderboard)
    return [] unless leaderboard

    leaderboard.leaderboard_ratings
               .includes(profile: :user)
               .where.not(profiles: { user_id: current_user.id })
               .map(&:profile)
               .compact
               .uniq { |profile| profile.id }
  end

  def handle_missing_leaderboard
    respond_to do |format|
      format.html do
        flash[:error] = "Leaderboard not found."
        redirect_to new_match_path
      end
      format.json { render json: { error: "Leaderboard not found" }, status: :not_found }
    end
    false
  end

  def handle_missing_profile
    respond_to do |format|
      format.html do
        flash[:error] = "You do not have a profile for this organization."
        redirect_to new_match_path
      end
      format.json { render json: { error: "Profile not found" }, status: :unprocessable_entity }
    end
    false
  end
end
