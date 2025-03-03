class MatchesController < ApplicationController
  before_action :authenticate_user!

  def new
    @match = Match.new
    @gyms = current_user.gyms.includes(users: :gym_memberships) # Efficiently preload users & their gym data

    # Build a hash of gym members excluding current user
    @gym_members = @gyms.index_with do |gym|
      gym.users.where.not(id: current_user.id)
    end
  end

  def create
    @match = Match.new(match_params)
    @match.user1 = current_user
    @match.gym = Gym.find(params[:match][:gym_id])

    opponent = User.find_by(id: params[:match][:opponent_id])

    unless opponent
      redirect_to new_match_path, alert: "Opponent not found." and return
    end

    @match.opponent = opponent
    @match.winner = (params[:match][:result] == "win") ? current_user : opponent
    @match.match_time = Time.current # Set match_time to current time

    if @match.save
      update_elo(@match)
      redirect_to matches_path, notice: "Match logged successfully!"
    else
      flash.now[:alert] = "Error logging match. Please check the details."
      render :new, status: :unprocessable_entity
    end
  end

  private

  def match_params
    params.require(:match).permit(:gym_id, :opponent_id, :submission, :result)
  end

  def update_elo(match)
    user1_membership = match.user1.gym_memberships.find_by(gym: match.gym)
    opponent_membership = match.opponent.gym_memberships.find_by(gym: match.gym)

    return unless user1_membership && opponent_membership # Prevents nil errors

    k_factor = 32

    # Convert win/loss to numerical values
    result1 = (match.winner == match.user1) ? 1 : 0
    result2 = 1 - result1 # Opponent's result is always the opposite

    # Get current Elo ratings
    elo1 = user1_membership.elo
    elo2 = opponent_membership.elo

    # Calculate expected scores
    expected1 = 1.0 / (1.0 + 10 ** ((elo2 - elo1) / 400.0))
    expected2 = 1.0 / (1.0 + 10 ** ((elo1 - elo2) / 400.0))

    # Update Elo ratings
    new_elo1 = elo1 + (k_factor * (result1 - expected1)).round
    new_elo2 = elo2 + (k_factor * (result2 - expected2)).round

    # Save new Elo ratings
    user1_membership.update!(elo: new_elo1)
    opponent_membership.update!(elo: new_elo2)
  end
end
