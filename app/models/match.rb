class Match < ApplicationRecord
  # == Associations ==
  belongs_to :leaderboard
  belongs_to :winner_profile, class_name: "Profile", inverse_of: :matches_won_as_profile, optional: true

  has_many :match_participants, -> { order(:created_at, :id) }, inverse_of: :match, dependent: :destroy
  has_many :profiles, through: :match_participants

  has_one :winner_participant, -> { where(is_winner: true) }, class_name: "MatchParticipant"

  accepts_nested_attributes_for :match_participants, allow_destroy: true

  # == Delegations ==
  delegate :profile, to: :winner_participant, prefix: true, allow_nil: true
  delegate :user, to: :winner_profile, prefix: true, allow_nil: true

  # Backwards compatibility helpers
  def profile1
    primary_participant&.profile
  end

  def opponent_profile
    secondary_participant&.profile
  end

  def user1
    profile1&.user
  end

  def opponent
    opponent_profile&.user
  end

  def winner
    winner_profile&.user
  end

  def profile1_id
    profile1&.id
  end

  def opponent_profile_id
    opponent_profile&.id
  end

  def user1_id
    profile1&.user_id
  end

  def opponent_id
    opponent_profile&.user_id
  end

  def winner_id
    winner_profile&.user_id
  end

  # == Validations ==
  validates :leaderboard_id, presence: true
  validates :winner_profile_id, presence: true, unless: :is_draw
  validate :validate_participant_count
  validate :validate_participants_unique
  validate :validate_participants_in_leaderboard
  validate :validate_participants_are_approved_members
  validate :validate_winner_in_participants

  before_validation :sync_winner_from_participants

  enum status: { active: 0, invalidated: 1 }, _default: :active

  # == Callbacks ==
  after_create :adjust_ratings
  after_create :record_elo_history

  # == Scopes ==
  scope :recent, -> { active.order(created_at: :desc) }
  scope :by_leaderboard, ->(leaderboard_id) { active.where(leaderboard_id: leaderboard_id) }
  scope :involving_profile, ->(profile_id) { joins(:match_participants).active.where(match_participants: { profile_id: profile_id }).distinct }
  scope :involving_profiles, lambda { |profile_ids|
    ids = Array(profile_ids).compact
    ids.empty? ? active.none : joins(:match_participants).active.where(match_participants: { profile_id: ids }).distinct
  }
  scope :won_by_profile, ->(profile_id) { active.where(winner_profile_id: profile_id) }
  scope :lost_by_profile, lambda { |profile_id|
    ids = Array(profile_id)
    joins(:match_participants)
      .active
      .where(match_participants: { profile_id: ids })
      .where.not(winner_profile_id: [nil] + ids)
      .distinct
  }
  scope :recent_by_profile, ->(profile_id) { involving_profile(profile_id).recent.limit(10) }
  scope :by_date_range, ->(start_date, end_date) { active.where(created_at: start_date..end_date) }

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

  def loser_participants
    return MatchParticipant.none if is_draw?

    match_participants.where.not(profile_id: winner_profile_id)
  end

  # Returns true if given profile (or profile id) won this match
  def player_won?(profile)
    profile_id = profile.respond_to?(:id) ? profile.id : profile
    winner_profile_id == profile_id
  end

  def invalidate!
    raise StandardError, "Match #{id} is already invalidated" if invalidated?

    ActiveRecord::Base.transaction do
      ratings = leaderboard.leaderboard_ratings.where(profile_id: participant_profile_ids).index_by(&:profile_id)
      ratings.values.each(&:lock!)

      if is_draw?
        ensure_draws_can_be_reverted!(*ratings.values)
        ratings.each_value { |rating| rating.update!(draws: rating.draws - 1) }
      else
        change = elo_change
        raise StandardError, "Match #{id} has no elo_change to revert" if change.nil?

        winner_rating = ratings.fetch(winner_profile_id)
        loser_rating = ratings.except(winner_profile_id).values.first

        raise StandardError, "Winner rating wins cannot be negative" if winner_rating.wins <= 0
        raise StandardError, "Loser rating losses cannot be negative" if loser_rating.losses <= 0

        winner_rating.update!(
          rating: winner_rating.rating - change,
          wins: winner_rating.wins - 1
        )
        loser_rating.update!(
          rating: loser_rating.rating + change,
          losses: loser_rating.losses - 1
        )
      end

      EloHistory.where(match_id: id).destroy_all

      match_participants.update_all(elo_before_match: nil, elo_after_match: nil)

      update!(status: :invalidated)
    end
  rescue => e
    Rails.logger.error "Failed to invalidate match #{id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise
  end

  private

  def participant_profile_ids
    match_participants.pluck(:profile_id)
  end

  def ensure_draws_can_be_reverted!(*ratings)
    ratings.each do |rating|
      next if rating.draws.positive?

      raise StandardError, "Cannot invalidate draw match because draws are already zero for rating ##{rating.id}"
    end
  end

  def validate_participant_count
    participants = active_participants
    errors.add(:match_participants, "must include exactly two participants") unless participants.size == 2
  end

  def validate_participants_unique
    duplicates = active_participants.group_by(&:profile_id).select { |_, records| records.size > 1 }.keys
    duplicates.each do |duplicate_id|
      errors.add(:match_participants, "contains duplicate participant for profile ##{duplicate_id}")
    end
  end

  def validate_participants_in_leaderboard
    return if leaderboard.nil?

    expected_organization_id = leaderboard.organization_id

    active_participants.each do |participant|
      next unless participant.profile
      next if participant.profile.organization_id == expected_organization_id

      errors.add(:match_participants, "profile #{participant.profile.username} is not a member of this leaderboard")
    end
  end

  def validate_participants_are_approved_members
    return if leaderboard.nil?

    organization_id = leaderboard.organization_id

    active_participants.each do |participant|
      profile = participant.profile
      membership = profile&.organization_membership

      unless membership&.approved? && membership.organization_id == organization_id
        identifier = profile&.username || "##{participant.profile_id}"
        errors.add(:match_participants, "profile #{identifier} must be approved to compete on this leaderboard")
      end
    end
  end

  def validate_winner_in_participants
    winners = active_participants.select(&:winner?)

    if is_draw? && winners.any?
      errors.add(:match_participants, "cannot mark a winner on a drawn match")
    end

    if winners.size > 1
      errors.add(:match_participants, "cannot have more than one winner")
    end

    return if winner_profile_id.blank?

    participant_ids = active_participants.filter_map(&:profile_id)
    unless participant_ids.include?(winner_profile_id)
      errors.add(:winner_profile_id, "must reference a match participant")
    end
  end

  def sync_winner_from_participants
    winner = active_participants.find(&:winner?)
    self.winner_profile = winner&.profile if winner && winner_profile_id.blank?
  end

  # Performs Elo adjustments for each match
  def adjust_ratings
    participants = match_participants.includes(:profile).to_a
    ratings_by_profile = {}

    participants.each do |participant|
      ratings_by_profile[participant.profile_id] = leaderboard.leaderboard_ratings.find_or_create_by(profile: participant.profile) do |r|
        r.rating = DEFAULT_RATING
        r.wins = 0
        r.losses = 0
        r.draws = 0
      end
    end

    before_ratings = ratings_by_profile.transform_values(&:rating)

    if is_draw?
      ActiveRecord::Base.transaction do
        participants.each do |participant|
          rating = ratings_by_profile.fetch(participant.profile_id)
          participant.update!(
            elo_before_match: before_ratings[participant.profile_id],
            elo_after_match: before_ratings[participant.profile_id]
          )
          rating.increment!(:draws)
        end
      end

      log_draw_match(participants, before_ratings)
      return
    end

    winner_rating = ratings_by_profile.fetch(winner_profile_id)
    loser_participant = participants.find { |participant| participant.profile_id != winner_profile_id }
    raise StandardError, "Match #{id} must include a losing participant" unless loser_participant
    loser_rating = ratings_by_profile.fetch(loser_participant.profile_id)

    change = calculate_elo_change(before_ratings.fetch(winner_profile_id), before_ratings.fetch(loser_participant.profile_id))

    ActiveRecord::Base.transaction do
      update_ratings(winner_rating, loser_rating, change)

      participants.each do |participant|
        rating = ratings_by_profile.fetch(participant.profile_id)
        participant.update!(
          elo_before_match: before_ratings[participant.profile_id],
          elo_after_match: rating.rating
        )
      end
    end

    log_rating_changes(participants, change)
  rescue => e
    Rails.logger.error "Elo adjustment failed for match #{id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end

  # Log draw match with no rating changes
  def log_draw_match(participants, before_ratings)
    log_data = {
      match_id: id,
      leaderboard_id: leaderboard_id,
      leaderboard_name: leaderboard.name,
      participants: participants.map do |participant|
        {
          profile_id: participant.profile_id,
          user_id: participant.profile.user_id,
          username: participant.profile.username,
          rating: before_ratings.fetch(participant.profile_id)
        }
      end,
      result: "Draw",
      elo_change: 0,
      timestamp: Time.current.iso8601
    }

    Rails.logger.info "MATCH_RESULT: #{log_data.to_json}"
  end

  def elo_change
    return nil if is_draw?

    participant = winner_participant
    return nil unless participant&.elo_before_match && participant.elo_after_match

    participant.elo_after_match - participant.elo_before_match
  end

  def calculate_elo_change(winner_before_rating, loser_before_rating)
    expected_score = 1.0 / (1.0 + 10**((loser_before_rating - winner_before_rating) / 400.0))
    (K_FACTOR * (1 - expected_score)).round
  end

  def update_ratings(winner_rating, loser_rating, change)
    winner_rating.increment!(:wins)
    loser_rating.increment!(:losses)

    winner_rating.update!(rating: winner_rating.rating + change)
    loser_rating.update!(rating: loser_rating.rating - change)
  end

  def log_rating_changes(participants, change)
    log_data = {
      match_id: id,
      leaderboard_id: leaderboard_id,
      leaderboard_name: leaderboard.name,
      participants: participants.map do |participant|
        {
          profile_id: participant.profile_id,
          user_id: participant.profile.user_id,
          username: participant.profile.username,
          old_rating: participant.elo_before_match,
          new_rating: participant.elo_after_match,
          winner: participant.winner?
        }
      end,
      result: winner_profile&.username,
      elo_change: change,
      timestamp: Time.current.iso8601
    }

    Rails.logger.info "MATCH_RESULT: #{log_data.to_json}"
  end

  def record_elo_history
    match_participants.includes(:profile).find_each do |participant|
      EloHistory.create!(
        profile: participant.profile,
        leaderboard: leaderboard,
        match: self,
        elo: participant.elo_after_match || DEFAULT_RATING,
        recorded_at: created_at
      )
    end
  end

  def primary_participant
    active_participants.first
  end

  def secondary_participant
    active_participants.second
  end

  def active_participants
    match_participants.reject(&:marked_for_destruction?)
  end
end
