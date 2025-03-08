class Leaderboard < ApplicationRecord
  before_validation :generate_slug, on: :create  # Auto-generate slug before saving

  belongs_to :organization
  belongs_to :sport_type
  has_many :leaderboard_ratings, dependent: :destroy
  has_many :matches, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :organization_id }
  validates :sport_type_id, presence: true  # Ensure sport type is required

  private

  def generate_slug
    self.slug ||= name.parameterize if name.present?
  end
end
