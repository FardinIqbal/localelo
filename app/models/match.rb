class Match < ApplicationRecord
  # == Associations ==
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User", foreign_key: "opponent_id"
  belongs_to :leaderboard
  belongs_to :winner, class_name: "User", foreign_key: "winner_id", optional: true

  # == Validations ==
  validates :user1_id, :opponent_id, :leaderboard_id, presence: true
  validates :winner_id, presence: true, unless: :is_draw
  validates :winner_id, inclusion: {
    in: ->(match) { [match.user1_id, match.opponent_id] },
    message: "must be either Player 1 or Opponent"
  }, if: -> { winner_id.present? }
  validates :user1_id, comparison: {
    other_than: :opponent_id,
    message: "cannot play against themselves"
  }
  validate :validate_users_in_leaderboard

  # == Callbacks ==
  after_create :adjust_ratings
  after_create :record_elo_history

  # == Scopes ==
  scope :recent, -> { order(created_at: :desc) }
  scope :by_leaderboard, ->(leaderboard_id) { where(leaderboard_id: leaderboard_id) }
  scope :involving_user, ->(user_id) {
    where("user1_id = :id OR opponent_id = :id", id: user_id)
  }
  scope :won_by, ->(user_id) { where(winner_id: user_id) }
  scope :lost_by, ->(user_id) {
    where("(user1_id = ? AND winner_id = opponent_id) OR (opponent_id = ? AND winner_id = user1_id)", user_id, user_id)
  }
  scope :recent_by_user, ->(user_id) { involving_user(user_id).recent.limit(10) }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }

  # == Constants ==
  K_FACTOR = 32
  DEFAULT_RATING = 1500

  # == Class Methods ==

  # Returns total match count for a given leaderboard
  def self.total_by_leaderboard(leaderboard_id)
    by_leaderboard(leaderboard_id).count
  end

  # Calculates win rate (%) for a user
  def self.win_rate(user_id)
    total = involving_user(user_id).count
    return 0 if total.zero?

    wins = won_by(user_id).count
    (wins.to_f / total * 100).round(2)
  end

  # == Instance Methods ==

  # Returns the winner's username or 'Unknown'
  def winner_name
    winner&.username || "Unknown"
  end

  # Returns the loser based on winner_id
  def loser
    return nil if is_draw
    winner_id == user1_id ? opponent : user1
  end

  # Returns true if given user won this match
  def player_won?(user_id)
    winner_id == user_id
  end

  private

  # Validates that both players are members of the leaderboard's organization
  def validate_users_in_leaderboard
    unless leaderboard.users.include?(user1)
      errors.add(:user1_id, "is not a member of this leaderboard")
    end

    unless leaderboard.users.include?(opponent)
      errors.add(:opponent_id, "is not a member of this leaderboard")
    end
  end

  # Performs Elo adjustments for each match
  def adjust_ratings
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
        id: user1.id,
        username: user1.username,
        rating: player1_rating.rating
      },
      player2: {
        id: opponent.id,
        username: opponent.username,
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
    outcome = winner_id == user1_id ? 1 : 0
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

  # Logs match outcome and Elo changes for audit/debugging
  def log_rating_changes(player1_rating, player2_rating, change, result)
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
        old_rating: player2_rating.rating - (winner_id == opponent.id ? change : -change),
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
