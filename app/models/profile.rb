class Profile < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  has_many :organization_memberships, dependent: :destroy
  has_many :leaderboard_ratings, dependent: :destroy
  has_many :matches_as_profile1, class_name: "Match", foreign_key: :profile1_id, inverse_of: :profile1, dependent: :destroy
  has_many :matches_as_opponent_profile, class_name: "Match", foreign_key: :opponent_profile_id, inverse_of: :opponent_profile, dependent: :destroy
  has_many :matches_won_as_profile, class_name: "Match", foreign_key: :winner_profile_id, inverse_of: :winner_profile, dependent: :nullify
  has_many :elo_histories, dependent: :destroy

  has_one_attached :avatar

  validates :username, presence: true, uniqueness: { scope: :organization_id }
  validates :user_id, uniqueness: { scope: :organization_id, message: "can only have one profile per organization" }
end
