class Leaderboard < ApplicationRecord
  belongs_to :organization
  belongs_to :sport_type
  has_many :leaderboard_ratings, dependent: :destroy
  has_many :matches, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :organization_id }
end
