class Match < ApplicationRecord
  # == Associations ==
  belongs_to :profile1, class_name: "Profile", inverse_of: :matches_as_profile1
  belongs_to :opponent_profile, class_name: "Profile", inverse_of: :matches_as_opponent_profile
  belongs_to :leaderboard
  belongs_to :winner_profile, class_name: "Profile", inverse_of: :matches_won_as_profile, optional: true

  # == Delegations ==
  delegate :user, to: :profile1, prefix: true
  delegate :user, to: :opponent_profile, prefix: true
  delegate :user, to: :winner_profile, prefix: true, allow_nil: true

  has_one :user1, through: :profile1, source: :user
  has_one :opponent, through: :opponent_profile, source: :user
  has_one :winner, through: :winner_profile, source: :user

  # == Validations ==
  validates :profile1_id, :opponent_profile_id, :leaderboard_id, presence: true
  validates :winner_profile_id, presence: true, unless: :is_draw
  validates :winner_profile_id, inclusion: {
    in: ->(match) { [match.profile1_id, match.opponent_profile_id] },
    message: "must be either Player 1 or Opponent"
  }, if: -> { winner_profile_id.present? }
  validates :profile1_id, comparison: {
    other_than: :opponent_profile_id,
    message: "cannot play against themselves"
  }
  validate :validate_profiles_in_leaderboard

  # == Callbacks ==
  after_create :adjust_ratings
  after_create :record_elo_history

  # == Scopes ==
  scope :recent, -> { order(created_at: :desc) }
  scope :by_leaderboard, ->(leaderboard_id) { where(leaderboard_id: leaderboard_id) }
  scope :involving_profile, ->(profile_id) { where("profile1_id = :id OR opponent_profile_id = :id", id: profile_id) }
  scope :involving_profiles, lambda { |profile_ids|
    ids = Array(profile_ids).compact
    ids.empty? ? none : where(profile1_id: ids).or(where(opponent_profile_id: ids))
  }
  scope :won_by_profile, ->(profile_id) { where(winner_profile_id: profile_id) }
  scope :lost_by_profile, lambda { |profile_id|
    where("(profile1_id = :id AND winner_profile_id = opponent_profile_id) OR (opponent_profile_id = :id AND winner_profile_id = profile1_id)", id: profile_id)
  }
  scope :recent_by_profile, ->(profile_id) { involving_profile(profile_id).recent.limit(10) }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }

  # == Constants ==
  K_FACTOR = 32
  DEFAULT_RATING = 1500

  # == Class Methods ==

  # Returns total match count for a given leaderboard
  def self.total_by_leaderboard(leaderboard_id)
    by_leaderboard(leaderboard_id).count
  end

  # Calculates win rate (%) for a profile
  def self.win_rate(profile_id)
    total = involving_profile(profile_id).count
    return 0 if total.zero?

    wins = won_by_profile(profile_id).count
    (wins.to_f / total * 100).round(2)
  end

  # == Instance Methods ==

  # Returns the winner's username or 'Unknown'
  def winner_name
    winner_profile&.username || "Unknown"
  end

  # Returns the loser profile based on winner_profile_id
  def loser_profile
    return nil if is_draw

    winner_profile_id == profile1_id ? opponent_profile : profile1
  end

  # Returns true if given profile (or profile id) won this match
  def player_won?(profile)
    profile_id = profile.respond_to?(:id) ? profile.id : profile
    winner_profile_id == profile_id
  end

  # Convenience methods for compatibility with legacy user-based checks
  def user1_id
    profile1&.user_id
  end

  def opponent_id
    opponent_profile&.user_id
  end

  def winner_id
    winner_profile&.user_id
  end

  private

  # Validates that both players belong to the leaderboard's organization
  def validate_profiles_in_leaderboard
    return if leaderboard.nil?

    expected_organization_id = leaderboard.organization_id

    unless profile1.organization_id == expected_organization_id
      errors.add(:profile1_id, "is not a member of this leaderboard")
    end

    unless opponent_profile.organization_id == expected_organization_id
      errors.add(:opponent_profile_id, "is not a member of this leaderboard")
    end
  end

  # Performs Elo adjustments for each match
  def adjust_ratings
    player1_rating = leaderboard.leaderboard_ratings.find_or_create_by(profile: profile1) do |r|
      r.rating = DEFAULT_RATING
      r.wins = 0
      r.losses = 0
    end

    player2_rating = leaderboard.leaderboard_ratings.find_or_create_by(profile: opponent_profile) do |r|
      r.rating = DEFAULT_RATING
      r.wins = 0
      r.losses = 0
    end

    # For draw matches, no rating change
    if is_draw
      log_draw_match(player1_rating, player2_rating)
      return
    end

    change = calculate_elo_change(player1_rating.rating, player2_rating.rating)

    ActiveRecord::Base.transaction do
      update_ratings(player1_rating, player2_rating, change)
    end
  rescue => e
    Rails.logger.error "Elo adjustment failed for match #{id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end

  # Log draw match with no rating changes
  def log_draw_match(player1_rating, player2_rating)
    log_data = {
      match_id: id,
      leaderboard_id: leaderboard_id,
      leaderboard_name: leaderboard.name,
      player1: {
        profile_id: profile1.id,
        user_id: profile1.user_id,
        username: profile1.username,
        rating: player1_rating.rating
      },
      player2: {
        profile_id: opponent_profile.id,
        user_id: opponent_profile.user_id,
        username: opponent_profile.username,
        rating: player2_rating.rating
      },
      result: "Draw",
      elo_change: 0,
      timestamp: Time.current.iso8601
    }

    Rails.logger.info "MATCH_RESULT: #{log_data.to_json}"
  end

  # Calculates Elo change based on expected outcome
  def calculate_elo_change(rating_a, rating_b)
    outcome = winner_profile_id == profile1_id ? 1 : 0
    change = (K_FACTOR * (outcome - expected_score(rating_a, rating_b))).round
    update_column(:elo_change, change.abs) # Store the absolute change
    change
  end

  # Returns expected win probability for player A
  def expected_score(rating_a, rating_b)
    1.0 / (1.0 + 10**((rating_b - rating_a) / 400.0))
  end

  # Updates both players' ratings and W/L records
  def update_ratings(player1_rating, player2_rating, change)
    if winner_profile_id == profile1_id
      player1_rating.increment!(:wins)
      player2_rating.increment!(:losses)
      player1_rating.update!(rating: player1_rating.rating + change)
      player2_rating.update!(rating: player2_rating.rating - change)
    else
      player2_rating.increment!(:wins)
      player1_rating.increment!(:losses)
      player2_rating.update!(rating: player2_rating.rating + change)
      player1_rating.update!(rating: player1_rating.rating - change)
    end

    winner_name = winner_profile_id == profile1_id ? profile1.username : opponent_profile.username
    log_rating_changes(player1_rating, player2_rating, change, winner_name)
  end

  # Logs match outcome and Elo changes for audit/debugging
  def log_rating_changes(player1_rating, player2_rating, change, result)
    log_data = {
      match_id: id,
      leaderboard_id: leaderboard_id,
      leaderboard_name: leaderboard.name,
      player1: {
        profile_id: profile1.id,
        user_id: profile1.user_id,
        username: profile1.username,
        old_rating: player1_rating.rating - (winner_profile_id == profile1_id ? change : -change),
        new_rating: player1_rating.rating
      },
      player2: {
        profile_id: opponent_profile.id,
        user_id: opponent_profile.user_id,
        username: opponent_profile.username,
        old_rating: player2_rating.rating - (winner_profile_id == opponent_profile_id ? change : -change),
        new_rating: player2_rating.rating
      },
      result: result,
      elo_change: change.abs,
      timestamp: Time.current.iso8601
    }

    Rails.logger.info "MATCH_RESULT: #{log_data.to_json}"
  end

  # Records point-in-time Elo snapshot after each match
  def record_elo_history
    EloHistory.create!(
      profile: profile1,
      leaderboard: leaderboard,
      elo: leaderboard.leaderboard_ratings.find_by(profile: profile1)&.rating || DEFAULT_RATING,
      recorded_at: created_at
    )

    EloHistory.create!(
      profile: opponent_profile,
      leaderboard: leaderboard,
      elo: leaderboard.leaderboard_ratings.find_by(profile: opponent_profile)&.rating || DEFAULT_RATING,
      recorded_at: created_at
    )
  end
end
