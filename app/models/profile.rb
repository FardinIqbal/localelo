class Profile < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  has_many :organization_memberships, dependent: :destroy

  has_many :leaderboard_ratings, dependent: :destroy
  has_many :leaderboards, through: :leaderboard_ratings
  has_many :match_participants, dependent: :destroy
  has_many :matches, -> { distinct }, through: :match_participants
  has_many :matches_won_as_profile, class_name: "Match", foreign_key: :winner_profile_id, inverse_of: :winner_profile

  has_one_attached :avatar

  validates :username, presence: true, uniqueness: { scope: :organization_id }
  validates :user_id, uniqueness: { scope: :organization_id, message: "can only have one profile per organization" }

  # Compatibility helpers for legacy code
  def matches_as_profile1
    matches
  end

  def matches_as_opponent_profile
    matches
  end
end
