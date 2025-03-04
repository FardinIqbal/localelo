class GymMembership < ApplicationRecord
  belongs_to :user
  belongs_to :gym

  # Dynamically calculates the user's rank within the gym based on Elo
  def rank
    gym_memberships = gym.gym_memberships.order(elo: :desc).pluck(:user_id)
    gym_memberships.index(user_id) + 1
  end


  # Retrieves the user's match history within the specific gym
  def match_history
    user.all_matches.where(gym: gym).order(match_time: :desc)
  end

  # Counts the number of wins for the user within the gym
  def win_count
    match_history.where(winner_id: user.id).count
  end

  # Counts the number of losses for the user within the gym
  def loss_count
    match_history.count - win_count
  end

  # Calculates the user's win rate within the gym
  def win_rate
    match_history.count.positive? ? ((win_count.to_f / match_history.count) * 100).round : 0
  end
end
