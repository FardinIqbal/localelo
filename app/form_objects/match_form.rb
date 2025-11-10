class MatchForm
  include ActiveModel::Model

  attr_accessor :leaderboard_id, :opponent_profile_id, :winner_profile_id, :profile1_id, :is_draw
  attr_reader :match

  validates :leaderboard_id, :opponent_profile_id, :profile1_id, presence: true
  validate :winner_or_draw_must_be_present
  validate :winner_must_be_participant
  validate :profiles_must_exist
  validate :profiles_belong_to_leaderboard

  def save
    return false unless valid?

    @match = Match.new(
      leaderboard_id: leaderboard_id,
      opponent_profile_id: opponent_profile_id,
      winner_profile_id: draw? ? nil : winner_profile_id,
      profile1_id: profile1_id,
      is_draw: draw?
    )

    if @match.save
      @match
    else
      errors.merge!(@match.errors)
      @match = nil
      false
    end
  end

  private

  def draw?
    ActiveModel::Type::Boolean.new.cast(is_draw)
  end

  def winner_or_draw_must_be_present
    return if draw? || winner_profile_id.present?

    errors.add(:base, "Either a winner must be selected or the match must be a draw")
  end

  def winner_must_be_participant
    return if draw? || winner_profile_id.blank?

    unless [profile1_id.to_i, opponent_profile_id.to_i].include?(winner_profile_id.to_i)
      errors.add(:winner_profile_id, "must be either Player 1 or Opponent")
    end
  end

  def profiles_must_exist
    errors.add(:profile1_id, "is not valid") unless profile1
    errors.add(:opponent_profile_id, "is not valid") unless opponent_profile

    if winner_profile_id.present? && !winner_profile
      errors.add(:winner_profile_id, "is not valid")
    end
  end

  def profiles_belong_to_leaderboard
    return unless leaderboard && profile1 && opponent_profile

    unless profile1.organization_id == leaderboard.organization_id
      errors.add(:profile1_id, "is not a member of this leaderboard")
    end

    unless opponent_profile.organization_id == leaderboard.organization_id
      errors.add(:opponent_profile_id, "is not a member of this leaderboard")
    end

    if winner_profile && winner_profile.organization_id != leaderboard.organization_id
      errors.add(:winner_profile_id, "is not a member of this leaderboard")
    end
  end

  def leaderboard
    @leaderboard ||= Leaderboard.find_by(id: leaderboard_id)
  end

  def profile1
    @profile1 ||= Profile.find_by(id: profile1_id)
  end

  def opponent_profile
    @opponent_profile ||= Profile.find_by(id: opponent_profile_id)
  end

  def winner_profile
    @winner_profile ||= Profile.find_by(id: winner_profile_id)
  end
end
