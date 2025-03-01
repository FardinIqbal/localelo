class GymsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_gym

  def show
    @players = @gym.players.order(elo: :desc)
  end

  def dashboard
    @players = @gym.players.order(elo: :desc)
    @matches = @gym.matches.includes(:player1, :player2, :winner).order(created_at: :desc)
  end

  private

  def set_gym
    @gym = Gym.find(params[:id])
  end
end
