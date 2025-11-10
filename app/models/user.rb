class User < ApplicationRecord
  # Include Devise modules for authentication functionality
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Add Active Storage for avatar
  has_one_attached :avatar

  # == Associations ==
  has_many :profiles, dependent: :destroy
  has_many :organization_memberships, through: :profiles
  has_many :organizations, -> { distinct }, through: :profiles

  has_many :leaderboard_ratings, through: :profiles
  has_many :leaderboards, -> { distinct }, through: :leaderboard_ratings

  has_many :matches_as_user1, through: :profiles, source: :matches_as_profile1
  has_many :matches_as_opponent, through: :profiles, source: :matches_as_opponent_profile
  has_many :matches_won, through: :profiles, source: :matches_won_as_profile

  # == Validations ==
  validates :email, presence: true, uniqueness: true
  validates :username, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true

  # == Instance Methods ==

  # Returns the profile for a given organization (accepts object or id)
  def profile_for(organization)
    organization_id = organization.respond_to?(:id) ? organization.id : organization
    profiles.find_by(organization_id: organization_id)
  end

  # Returns all matches the user has participated in
  def matches
    Match.involving_profiles(profile_ids)
  end

  # Returns matches ordered by recency
  def recent_matches(limit = 5)
    matches.recent.limit(limit)
  end

  # Calculates overall win rate across all profiles
  def win_rate
    total = total_matches
    return 0 if total.zero?

    (total_wins.to_f / total * 100).round(2)
  end

  # Checks if the user is a member of a given organization
  def member_of?(organization)
    organization_id = organization.respond_to?(:id) ? organization.id : organization
    profiles.exists?(organization_id: organization_id)
  end

  # Returns Elo rating for a given leaderboard (defaults to 1500 if no rating found)
  def elo_for(leaderboard)
    board = leaderboard.respond_to?(:id) ? leaderboard : Leaderboard.find_by(id: leaderboard)
    return 1500 unless board

    profile = profile_for(board.organization_id)
    return 1500 unless profile

    leaderboard_ratings.find_by(leaderboard: board, profile: profile)&.rating || 1500
  end

  # Total number of matches played by the user
  def total_matches
    Match.involving_profiles(profile_ids).count
  end

  # Total matches won by the user
  def total_wins
    Match.won_by_profile(profile_ids).count
  end

  # Total matches lost by the user
  def total_losses
    total_matches - total_wins
  end

  # Calculates the user's overall win/loss ratio
  def win_loss_ratio
    total_matches.positive? ? (total_wins.to_f / total_matches).round(2) : 0
  end

  # Returns win percentage
  def win_percentage
    total = total_matches
    return 0 if total.zero?

    (total_wins.to_f / total * 100).round(1)
  end

  # Returns win/loss ratio for a specific leaderboard
  def win_loss_ratio_for_leaderboard(leaderboard)
    board = leaderboard.respond_to?(:id) ? leaderboard : Leaderboard.find_by(id: leaderboard)
    return 0 unless board

    profile = profile_for(board.organization_id)
    return 0 unless profile

    matches = Match.by_leaderboard(board.id).involving_profile(profile.id)
    total = matches.count
    return 0 if total.zero?

    wins = matches.won_by_profile(profile.id).count
    (wins.to_f / total).round(2)
  end

  # Returns the user's most frequent opponent across all matches
  def most_frequent_opponent
    ids = profile_ids
    return if ids.empty?

    matches = Match.involving_profiles(ids)
    return nil if matches.empty?

    opponent_column = Arel.sql("CASE WHEN profile1_id IN (#{ids.join(',')}) THEN opponent_profile_id ELSE profile1_id END")

    most_faced_profile_id = matches
                              .group(opponent_column)
                              .order(Arel.sql("COUNT(*) DESC"))
                              .limit(1)
                              .pluck(opponent_column)
                              .first

    Profile.find_by(id: most_faced_profile_id)&.user
  end

  # Returns the user's most frequent opponent for a specific leaderboard
  def most_frequent_opponent_for_leaderboard(leaderboard)
    board = leaderboard.respond_to?(:id) ? leaderboard : Leaderboard.find_by(id: leaderboard)
    return nil unless board

    profile = profile_for(board.organization_id)
    return nil unless profile

    matches = Match.by_leaderboard(board.id).involving_profile(profile.id)
    return nil if matches.empty?

    opponent_column = Arel.sql("CASE WHEN profile1_id = #{profile.id} THEN opponent_profile_id ELSE profile1_id END")

    most_faced_profile_id = matches
                              .group(opponent_column)
                              .order(Arel.sql("COUNT(*) DESC"))
                              .limit(1)
                              .pluck(opponent_column)
                              .first

    Profile.find_by(id: most_faced_profile_id)&.user
  end

  # Calculates the percentage change in win ratio compared to the previous month
  def win_ratio_trend
    ids = profile_ids
    return 0 if ids.empty?

    this_month_matches = Match.where("created_at >= ?", Time.current.beginning_of_month)
                              .involving_profiles(ids)
    this_month_wins = Match.won_by_profile(ids).where(id: this_month_matches.select(:id)).count
    this_month_ratio = this_month_matches.any? ? (this_month_wins.to_f / this_month_matches.count * 100).round(2) : 0

    last_month_start = 1.month.ago.beginning_of_month
    last_month_end = 1.month.ago.end_of_month
    last_month_matches = Match.where(created_at: last_month_start..last_month_end)
                              .involving_profiles(ids)
    last_month_wins = Match.won_by_profile(ids).where(id: last_month_matches.select(:id)).count
    last_month_ratio = last_month_matches.any? ? (last_month_wins.to_f / last_month_matches.count * 100).round(2) : 0

    return 0 if last_month_ratio.zero?

    ((this_month_ratio - last_month_ratio) / last_month_ratio * 100).round(2)
  end

  # Returns the highest Elo rating the user has ever achieved
  def highest_elo
    leaderboard_ratings.maximum(:rating) || 1500
  end
end
