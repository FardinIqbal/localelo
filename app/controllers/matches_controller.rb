class MatchesController < ApplicationController
  before_action :authenticate_user!

  def new
    @match = Match.new
    @gyms = current_user.gyms.includes(users: :gym_memberships) # Efficiently preload users & gym data

    # Build a hash of gym members excluding the current user
    @gym_members = @gyms.index_with do |gym|
      gym.users.where.not(id: current_user.id)
    end
  end

  def create
    @match = Match.new(match_params)
    @match.user1 = current_user
    @match.gym = Gym.find_by(id: params[:match][:gym_id])

    unless @match.gym
      redirect_to new_match_path, alert: "Invalid gym selected." and return
    end

    opponent = User.find_by(id: params[:match][:opponent_id])

    unless opponent
      redirect_to new_match_path, alert: "Opponent not found." and return
    end

    # Set opponent and determine winner
    @match.opponent = opponent
    if params[:match][:winner_id].present?
      @match.winner = User.find_by(id: params[:match][:winner_id])
    else
      @match.winner = nil # In case of a draw or unconfirmed winner
    end

    @match.match_time = Time.zone.now # Ensure proper timestamp

    if @match.save
      update_elo(@match) if @match.winner # Elo updates only if there is a winner
      redirect_to gym_path(@match.gym), notice: "Match logged successfully!"
    else
      flash.now[:alert] = "Error logging match. Please check the details."
      render :new, status: :unprocessable_entity
    end
  end

  private

  # Strong parameters: Ensures only allowed attributes are passed
  def match_params
    params.require(:match).permit(:gym_id, :opponent_id, :winner_id, :submission)
  end

  # Updates Elo ratings for both players after a match
  def update_elo(match)
    # Fetch user memberships within the gym
    user1_membership = match.user1.gym_memberships.find_by(gym: match.gym)
    opponent_membership = match.opponent.gym_memberships.find_by(gym: match.gym)

    # Prevent errors if either user lacks a gym membership
    return unless user1_membership && opponent_membership

    k_factor = 32 # Elo adjustment factor (standard)

    # Convert win/loss to numerical values for Elo formula
    result1 = (match.winner == match.user1) ? 1 : 0
    result2 = 1 - result1 # Opponent's result is always the opposite

    # Fetch current Elo ratings
    elo1 = user1_membership.elo
    elo2 = opponent_membership.elo

    # Calculate expected scores based on current ratings
    expected1 = 1.0 / (1.0 + 10 ** ((elo2 - elo1) / 400.0))
    expected2 = 1.0 / (1.0 + 10 ** ((elo1 - elo2) / 400.0))

    # Compute new Elo ratings using the Elo formula
    new_elo1 = elo1 + (k_factor * (result1 - expected1)).round
    new_elo2 = elo2 + (k_factor * (result2 - expected2)).round

    # Update users' Elo ratings in the gym
    user1_membership.update!(elo: new_elo1)
    opponent_membership.update!(elo: new_elo2)

    # Save Elo change history for analytics
    match.update!(elo_change: (new_elo1 - elo1).abs)
  end
end
