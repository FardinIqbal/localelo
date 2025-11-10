class User < ApplicationRecord
  include Discard::Model

  default_scope { kept }
  before_discard :anonymize_user

  # Include Devise modules for authentication functionality
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # == Associations ==
  has_many :profiles
  has_many :organization_memberships, through: :profiles
  has_many :organizations, -> { distinct }, through: :profiles

  has_many :leaderboard_ratings, through: :profiles
  has_many :leaderboards, -> { distinct }, through: :leaderboard_ratings

  has_many :match_participants, through: :profiles
  has_many :participated_matches, -> { distinct }, through: :match_participants, source: :match
  has_many :matches_won, through: :profiles, source: :matches_won_as_profile

  # == Instance Methods ==

  # Returns all matches the user has participated in (as player 1 or opponent)
  def matches
    ids = profile_ids
    return Match.none if ids.empty?

    Match.active.joins(:match_participants)
         .where(match_participants: { profile_id: ids })
         .includes(match_participants: { profile: :user }, leaderboard: :organization)
         .distinct
  end

  def total_matches
    matches.count
  end

  def total_wins
    wins_count
  end

  def total_losses
    ids = profile_ids
    return 0 if ids.empty?

    Match.active
         .joins(:match_participants)
         .where(match_participants: { profile_id: ids })
         .where.not(winner_profile_id: ids)
         .where.not(winner_profile_id: nil)
         .distinct
         .count
  end

  def draws_count
    matches.where(is_draw: true).count
  end

  def wins_count
    ids = profile_ids
    return 0 if ids.empty?

    Match.active.where(winner_profile_id: ids).count
  end

  def win_percentage
    total = matches.count
    return 0 if total.zero?

    (wins_count.to_f / total * 100).round(1)
  end

  def win_loss_ratio
    losses = total_losses
    return total_wins if losses.zero?

    (total_wins.to_f / losses).round(2)
  end

  def highest_elo
    leaderboard_ratings.maximum(:rating) || Match::DEFAULT_RATING
  end

  def win_ratio_trend(limit: 10)
    ids = profile_ids
    return [] if ids.empty?

    recent_matches = Match.active
                           .joins(:match_participants)
                           .where(match_participants: { profile_id: ids })
                           .order(created_at: :desc)
                           .limit(limit)
                           .includes(match_participants: { profile: :user })
                           .distinct
                           .to_a
                           .reverse
    return [] if recent_matches.empty?

    wins = 0
    total = 0

    recent_matches.map do |match|
      total += 1
      wins += 1 if match.winner_profile_id.present? && ids.include?(match.winner_profile_id)
      {
        match_id: match.id,
        occurred_at: match.created_at,
        win_rate: total.zero? ? 0 : (wins.to_f / total * 100).round(1)
      }
    end
  end

  def most_frequent_opponent
    ids = profile_ids
    return nil if ids.empty?

    match_ids = MatchParticipant.where(profile_id: ids).select(:match_id)

    opponent_profile_id = MatchParticipant
                            .joins(:match)
                            .merge(Match.active)
                            .where(match_id: match_ids)
                            .where.not(profile_id: ids)
                            .group(:profile_id)
                            .order(Arel.sql("COUNT(*) DESC"))
                            .limit(1)
                            .pluck(:profile_id)
                            .first

    Profile.find_by(id: opponent_profile_id)&.user
  end

  # Returns the Elo rating for the user on the provided leaderboard.
  # Accepts either a leaderboard object or its ID. If the user hasn't
  # played on the leaderboard yet, returns the default rating.
  def elo_for(leaderboard)
    rating = leaderboard_rating_for(leaderboard)
    rating&.rating || Match::DEFAULT_RATING
  end

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

  def username=(value)
    update_all_profiles(username: value)
  end

  def first_name
    primary_profile&.first_name
  end

  def first_name=(value)
    update_all_profiles(first_name: value)
  end

  def last_name
    primary_profile&.last_name
  end

  def last_name=(value)
    update_all_profiles(last_name: value)
  end

  # == Validations ==
  validates :email, presence: true, uniqueness: { scope: :discarded_at }

  private

  def profile_ids
    @profile_ids ||= profiles.ids
  end

  def anonymize_user
    identifier = id

    self.email = "anonymized_#{identifier}@localelo.com"
    self.username = "Deleted User #{identifier}"
    self.first_name = "Deleted"
    self.last_name = "User"
    self.encrypted_password = SecureRandom.hex(32)
  end

  def update_all_profiles(attributes)
    return unless profiles.exists?

    profiles.update_all(attributes.merge(updated_at: Time.current))
  end

  def leaderboard_rating_for(leaderboard)
    leaderboard_id = leaderboard.respond_to?(:id) ? leaderboard.id : leaderboard
    leaderboard_ratings.find_by(leaderboard_id: leaderboard_id)
  end
end
