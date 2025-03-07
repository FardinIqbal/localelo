class LeaderboardRating < ApplicationRecord
  belongs_to :user
  belongs_to :leaderboard

  validates :rating, numericality: { only_integer: true }
  validates :wins, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :losses, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
