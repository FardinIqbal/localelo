class Match < ApplicationRecord
  # Associations
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User", foreign_key: "opponent_id"
  belongs_to :leaderboard
  belongs_to :winner, class_name: "User", foreign_key: "winner_id", optional: true

  # Validations
  validates :user1_id, :opponent_id, :leaderboard_id, presence: true
  validates :winner_id, inclusion: {
    in: ->(match) { [match.user1_id, match.opponent_id] },
    message: "must be either Player 1 or Opponent",
    allow_nil: true # Allow nil for draw matches
  }
  validates :user1_id, comparison: {
    other_than: :opponent_id,
    message: "cannot play against themselves"
  }
  validate :validate_draw_or_winner
  validate :validate_users_in_leaderboard

  # Callbacks
  after_create :adjust_ratings
  after_create :record_elo_history

  # Scopes for common queries
  scope :recent, -> { order(created_at: :desc) }
  scope :by_leaderboard, ->(leaderboard_id) { where(leaderboard_id: leaderboard_id) }
  scope :involving_user, ->(user_id) { where("user1_id = ? OR opponent_id = ?", user_id, user_id) }
  scope :won_by, ->(user_id) { where(winner_id: user_id) }
  scope :lost_by, ->(user_id) { where("(user1_id = ? AND winner_id = ?) OR (opponent_id = ? AND winner_id = ?)",
                                      user_id, :opponent_id, user_id, :user1_id) }
  scope :draws, -> { where(is_draw: true) }
  scope :verified, -> { where(verified: true) }
  scope :unverified, -> { where(verified: false) }
  scope :recent_by_user, ->(user_id) { involving_user(user_id).recent.limit(10) }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }

  # Constants
  K_FACTOR = 32
  DEFAULT_RATING = 1500

  # Class methods for analytics
  def self.total_by_leaderboard(leaderboard_id)
    by_leaderboard(leaderboard_id).count
  end

  def self.win_rate(user_id)
    total = involving_user(user_id).verified.count
    return 0 if total == 0

    wins = won_by(user_id).verified.count
    (wins.to_f / total * 100).round(2)
  end

  # Instance methods
  def winner_name
    return "Draw" if is_draw
    winner&.username || "Unknown"
  end

  def loser
    return nil if is_draw
    winner_id == user1_id ? opponent : user1
  end

  def player_won?(user_id)
    winner_id == user_id
  end

  def verify!
    update!(verified: true)
  end

  private

  def validate_draw_or_winner
    if is_draw && winner_id.present?
      errors.add(:base, "Match cannot be both a draw and have a winner")
    end

    if !is_draw && winner_id.nil?
      errors.add(:base, "Match must either be a draw or have a winner")
    end
  end

  def validate_users_in_leaderboard
    unless leaderboard.users.include?(user1)
      errors.add(:user1_id, "is not a member of this leaderboard")
    end

    unless leaderboard.users.include?(opponent)
      errors.add(:opponent_id, "is not a member of this leaderboard")
    end
  end

  def adjust_ratings
    return unless verified

    player1 = user1
    player2 = opponent

    player1_rating = leaderboard.leaderboard_ratings.find_or_create_by(user_id: player1.id) do |r|
      r.rating = DEFAULT_RATING
      r.wins = 0
      r.losses = 0
    end

    player2_rating = leaderboard.leaderboard_ratings.find_or_create_by(user_id: player2.id) do |r|
      r.rating = DEFAULT_RATING
      r.wins = 0
      r.losses = 0
    end

    if is_draw
      handle_draw(player1_rating, player2_rating)
    else
      change = calculate_elo_change(player1_rating.rating, player2_rating.rating)

      ActiveRecord::Base.transaction do
        update_ratings(player1_rating, player2_rating, change)
      end
    end
  rescue => e
    Rails.logger.error "Elo adjustment failed for match #{id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")

    # Consider using an error tracking service like Sentry here
    # Sentry.capture_exception(e, extra: { match_id: id })
  end

  def handle_draw(player1_rating, player2_rating)
    # For draws, adjust ratings slightly based on expected outcome
    expected = expected_score(player1_rating.rating, player2_rating.rating)
    change = (K_FACTOR * (0.5 - expected)).round

    ActiveRecord::Base.transaction do
      # In a draw, both players' draw counts would be incremented
      # This requires adding a 'draws' column to leaderboard_ratings

      # Update ratings
      player1_rating.update!(rating: player1_rating.rating + change)
      player2_rating.update!(rating: player2_rating.rating - change)

      # Store the change for display purposes
      update_column(:elo_change, change.abs)
    end

    log_rating_changes(player1_rating, player2_rating, change, "Draw")
  end

  def calculate_elo_change(rating_a, rating_b)
    outcome = winner_id == user1_id ? 1 : 0
    change = (K_FACTOR * (outcome - expected_score(rating_a, rating_b))).round

    # Store the change for display purposes
    update_column(:elo_change, change.abs)

    change
  end

  def expected_score(rating_a, rating_b)
    1.0 / (1.0 + 10**((rating_b - rating_a) / 400.0))
  end

  def update_ratings(player1_rating, player2_rating, change)
    if winner_id == user1_id
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

    winner_name = winner_id == user1_id ? user1.username : opponent.username
    log_rating_changes(player1_rating, player2_rating, change, winner_name)
  end

  def log_rating_changes(player1_rating, player2_rating, change, result)
    # Use structured logging format for better parsing
    log_data = {
      match_id: id,
      leaderboard_id: leaderboard_id,
      leaderboard_name: leaderboard.name,
      player1: {
        id: user1.id,
        username: user1.username,
        old_rating: player1_rating.rating - (winner_id == user1_id ? change : -change),
        new_rating: player1_rating.rating
      },
      player2: {
        id: opponent.id,
        username: opponent.username,
        old_rating: player2_rating.rating - (winner_id == opponent_id ? change : -change),
        new_rating: player2_rating.rating
      },
      result: result,
      elo_change: change.abs,
      timestamp: Time.current.iso8601
    }

    Rails.logger.info "MATCH_RESULT: #{log_data.to_json}"
  end

  def record_elo_history
    return unless verified

    # Record point-in-time Elo ratings for historical tracking
    EloHistory.create!(
      user_id: user1.id,
      leaderboard_id: leaderboard_id,
      elo: leaderboard.leaderboard_ratings.find_by(user_id: user1.id)&.rating || DEFAULT_RATING,
      recorded_at: created_at
    )

    EloHistory.create!(
      user_id: opponent.id,
      leaderboard_id: leaderboard_id,
      elo: leaderboard.leaderboard_ratings.find_by(user_id: opponent.id)&.rating || DEFAULT_RATING,
      recorded_at: created_at
    )
  end
end
