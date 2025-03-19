class LeaderboardRating < ApplicationRecord
  belongs_to :user
  belongs_to :leaderboard

  validates :user, presence: true
  validates :leaderboard, presence: true
  validates :rating, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :wins, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :losses, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  after_initialize :set_defaults, if: :new_record?

  private

  def set_defaults
    self.wins ||= 0
    self.losses ||= 0
    self.rating ||= 1500  # Standard starting Elo rating
  end
end
