class User < ApplicationRecord
  # Include Devise modules for authentication functionality
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # == Associations ==
  has_many :profiles
  has_many :organization_memberships, through: :profiles
  has_many :organizations, -> { distinct }, through: :profiles

  has_many :leaderboard_ratings, through: :profiles
  has_many :leaderboards, -> { distinct }, through: :leaderboard_ratings

  has_many :matches_as_user1, through: :profiles, source: :matches_as_profile1
  has_many :matches_as_opponent, through: :profiles, source: :matches_as_opponent_profile
  has_many :matches_won, through: :profiles, source: :matches_won_as_profile

  # == Validations ==
  validates :email, presence: true, uniqueness: true
end
