class Leaderboard < ApplicationRecord
  belongs_to :organization
  has_many :leaderboard_ratings, dependent: :destroy
  has_many :users, through: :leaderboard_ratings
  has_many :matches, dependent: :destroy

  validates :name, presence: true

  after_create :add_organization_members_to_leaderboard

  private

  # Automatically add all organization members to the leaderboard when created
  def add_organization_members_to_leaderboard
    Rails.logger.info "=== DEBUG: Adding Organization Members to Leaderboard #{id} ==="

    organization.users.find_each do |user|
      LeaderboardRating.create!(
        user_id: user.id,
        leaderboard_id: id,
        rating: 1500, # Default Elo rating
        wins: 0,
        losses: 0
      )
    end
  end
end
