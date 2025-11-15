class LeaderboardRating < ApplicationRecord
  belongs_to :profile
  belongs_to :leaderboard
  has_one :user, through: :profile

  validates :profile, presence: true
  validates :leaderboard, presence: true
  validates :profile_id, uniqueness: { scope: :leaderboard_id }
  validates :rating, numericality: { greater_than_or_equal_to: 0 }
  validates :rating_deviation, numericality: { greater_than_or_equal_to: 0 }
  validates :volatility, numericality: { greater_than_or_equal_to: 0 }
  validates :wins, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :losses, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :draws, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  after_initialize :set_defaults, if: :new_record?

  private

  def set_defaults
    self.wins ||= 0
    self.losses ||= 0
    self.draws ||= 0
    self.rating ||= 1500.0
    self.rating_deviation ||= 350.0
    self.volatility ||= 0.06
  end
end
