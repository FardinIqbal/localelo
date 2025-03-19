class Match < ApplicationRecord
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User"
  belongs_to :leaderboard

  validates :user1_id, :opponent_id, :leaderboard_id, :winner_id, presence: true
  validates :winner_id, inclusion: { in: ->(match) { [match.user1_id, match.opponent_id] },
                                     message: "must be either Player 1 or Opponent" }
end
