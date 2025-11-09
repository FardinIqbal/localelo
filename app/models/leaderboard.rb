class Leaderboard < ApplicationRecord
  belongs_to :organization
  has_many :leaderboard_ratings, dependent: :destroy
  has_many :profiles, through: :leaderboard_ratings
  has_many :users, through: :profiles
  has_many :matches, dependent: :destroy

  validates :name, presence: true

  after_create :add_organization_members_to_leaderboard

  private

  # Automatically add all organization members to the leaderboard when created
  def add_organization_members_to_leaderboard
    Rails.logger.info "=== DEBUG: Adding Organization Members to Leaderboard #{id} ==="

    organization.profiles.find_each do |profile|
      LeaderboardRating.create!(
        profile: profile,
        leaderboard: self,
        rating: 1500, # Default Elo rating
        wins: 0,
        losses: 0
      )
    end
  end
end
