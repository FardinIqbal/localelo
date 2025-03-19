class MatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match, only: [:show]
  before_action :load_leaderboards_and_users, only: [:new, :create]

  # GET /matches
  def index
    @matches = current_user.matches
                           .includes(:user1, :opponent, :leaderboard)
                           .recent
                           .page(params[:page])
                           .per(20)
  end

  # GET /matches/new
  def new
    @match = Match.new
  end

  # POST /matches
  def create
    @match_form = MatchForm.new(match_params.merge(user1_id: current_user.id))

    if @match_form.save
      redirect_to matches_path, notice: "Match successfully logged!"
    else
      flash.now[:error] = @match_form.errors.full_messages.to_sentence
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
    @match = Match.includes(:user1, :opponent, :leaderboard).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:error] = "Match not found."
    redirect_to matches_path
  end

  def load_leaderboards_and_users
    @leaderboards = current_user.organizations
                                .includes(:leaderboards)
                                .flat_map(&:leaderboards)
                                .uniq || []

    # Only load users if a leaderboard is selected
    if params[:match] && params[:match][:leaderboard_id].present?
      leaderboard_id = params[:match][:leaderboard_id]
      @users = LeaderboardUsersQuery.new(leaderboard_id, current_user.id).call
    else
      @users = []
    end
  end
end
