class GymsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_gym, only: [:show, :dashboard]

  def index
    @gyms = Gym.joins(:players).where(players: { user_id: current_user.id }).distinct
  end

  def show
    @players = @gym.players.order(elo: :desc)
  end

  def dashboard
    unless @gym.players.exists?(user: current_user)
      redirect_to gyms_path, alert: "You are not a member of this gym."
      return
    end

    @players = @gym.players.order(elo: :desc)
    @matches = Match.includes(:player1, :player2, :winner).where(gym: @gym).order(created_at: :desc)
    @pending_requests = MatchRequest.where(gym: @gym, opponent: current_user.players, status: "pending")
  end

  def new
    @gym = Gym.new
  end

  def create
    @gym = Gym.new(gym_params)
    if @gym.save
      @gym.players.create!(user: current_user, elo: 1500) # Auto-add creator as a player
      redirect_to @gym, notice: "Gym successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_gym
    @gym = Gym.find(params[:id])
  end

  def gym_params
    params.require(:gym).permit(:name, :subdomain)
  end
end
