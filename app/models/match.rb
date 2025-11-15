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

  # == Scopes ==
  scope :recent, -> { order(created_at: :desc) }
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
    # With Glicko-2, reverting ratings is complex as it would require recalculating the entire rating period.
    # For now, we will just mark the match as invalidated.
    # A more complete solution could involve a new rating period calculation excluding the invalidated match.
    update!(status: :invalidated)
  end

  def elo_change_for_user(user)
    participant = match_participants.find { |p| p.profile.user_id == user.id }
    participant&.elo_change&.round
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
