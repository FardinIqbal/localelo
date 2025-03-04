class Match < ApplicationRecord
  belongs_to :gym
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User", foreign_key: "opponent_id"
  belongs_to :winner, class_name: "User", foreign_key: "winner_id", optional: true

  validates :match_time, presence: true

  # Returns the opponent of a given user
  def opponent_for(user)
    return nil unless user
    user1 == user ? opponent : user1
  end

  # Determines the loser of the match
  def loser
    return nil unless winner # Handles cases where no winner is set
    user1 == winner ? opponent : user1
  end

  # Determines if the given user won the match
  def won_by?(user)
    winner == user
  end

  # Determines if the given user lost the match
  def lost_by?(user)
    loser == user
  end

  # Calculates Elo change for the winner
  def elo_change_for_winner
    return 0 unless winner.present? && elo_change.present?
    elo_change.abs # Winner gains Elo (always positive)
  end

  # Calculates Elo change for the loser
  def elo_change_for_loser
    return 0 unless loser.present? && elo_change.present?
    -elo_change.abs # Loser loses Elo (always negative)
  end
end
