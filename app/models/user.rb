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

  # == Instance Methods ==

  # Returns the first profile for the user (used as a sensible default)
  def primary_profile
    profiles.order(:created_at).first
  end

  # Fetches the profile for a specific organization (accepts object or id)
  def profile_for(organization)
    organization_id = organization.respond_to?(:id) ? organization.id : organization
    profiles.find_by(organization_id: organization_id)
  end

  # Backwards compatible helpers for legacy code that still references user
  # attributes that previously lived on the users table. These now delegate to
  # the associated profile records.
  def username
    profile_username = primary_profile&.username
    profile_username.presence || email&.split("@").first
  end

  def first_name
    primary_profile&.first_name
  end

  def last_name
    primary_profile&.last_name
  end

  # == Validations ==
  validates :email, presence: true, uniqueness: true
end
