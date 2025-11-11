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

    organization.organization_memberships.approved.includes(:profile).find_each do |membership|
      profile = membership.profile
      next unless profile

      LeaderboardRating.find_or_create_by!(
        profile: profile,
        leaderboard: self
      ) do |rating|
        rating.rating = 1500
        rating.wins = 0
        rating.losses = 0
        rating.draws = 0
      end
    end
  end
end
