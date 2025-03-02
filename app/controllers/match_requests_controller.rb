class MatchRequestsController < ApplicationController
  before_action :authenticate_user!

  def create
    @opponent = Player.find(params[:opponent_id])
    @challenger = current_user.players.find_by(gym_id: @opponent.gym_id)

    if @challenger.nil?
      redirect_to root_path, alert: "You must be part of the gym to challenge players."
      return
    end

    @match_request = MatchRequest.create!(
      challenger: @challenger,
      opponent: @opponent,
      gym: @challenger.gym,
      expires_at: 1.hour.from_now
    )

    redirect_to dashboard_gym_path(@challenger.gym), notice: "Match request sent!"
  end

  def accept
    @match_request = MatchRequest.find(params[:id])

    if @match_request.opponent.user == current_user && @match_request.status == "pending"
      @match_request.update(status: "accepted")
      Match.create!(
        player1: @match_request.challenger,
        player2: @match_request.opponent,
        gym: @match_request.gym,
        match_time: "5m"
      )
      redirect_to dashboard_gym_path(@match_request.gym), notice: "Match accepted!"
    else
      redirect_to root_path, alert: "Unauthorized."
    end
  end

  def decline
    @match_request = MatchRequest.find(params[:id])

    if @match_request.opponent.user == current_user && @match_request.status == "pending"
      @match_request.update(status: "declined")
      redirect_to dashboard_gym_path(@match_request.gym), notice: "Match request declined."
    else
      redirect_to root_path, alert: "Unauthorized."
    end
  end
end