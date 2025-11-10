class MatchForm
  include ActiveModel::Model

  attr_accessor :leaderboard_id, :opponent_profile_id, :winner_profile_id, :profile1_id, :is_draw
  attr_reader :match

  validates :leaderboard_id, :opponent_profile_id, :profile1_id, presence: true
  validate :winner_or_draw_must_be_present
  validate :winner_must_be_player
  validate :opponent_must_be_in_leaderboard
  validate :profiles_must_exist

  def save
    return false unless valid?

    @match = Match.new(attributes)

    if @match.save
      @match
    else
      errors.merge!(@match.errors)
      @match = nil
      false
    end
  end

  private

  def attributes
    {
      leaderboard_id: leaderboard_id,
      opponent_profile_id: opponent_profile_id.presence,
      winner_profile_id: draw? ? nil : winner_profile_id.presence,
      profile1_id: profile1_id.presence,
      is_draw: draw?
    }
  end

  def draw?
    is_draw.to_s == "1"
  end

  def winner_or_draw_must_be_present
    if winner_profile_id.blank? && !draw?
      errors.add(:base, "Either a winner must be selected or the match must be a draw")
    end
  end

  def winner_must_be_player
    return if winner_profile_id.blank? || profile1_id.blank? || opponent_profile_id.blank? || draw?

    unless [profile1_id.to_i, opponent_profile_id.to_i].include?(winner_profile_id.to_i)
      errors.add(:winner_profile_id, "must be either Player 1 or Opponent")
    end
  end

  def opponent_must_be_in_leaderboard
    return if opponent_profile_id.blank? || leaderboard.nil?

    unless opponent_profile && opponent_profile.organization_id == leaderboard.organization_id
      errors.add(:opponent_profile_id, "must be a member of the selected leaderboard")
    end
  end

  def profiles_must_exist
    if leaderboard.nil?
      errors.add(:leaderboard_id, "is not valid")
      return
    end

    errors.add(:profile1_id, "does not have a profile in this organization") unless profile1&.organization_id == leaderboard.organization_id
    errors.add(:opponent_profile_id, "does not have a profile in this organization") unless opponent_profile&.organization_id == leaderboard.organization_id

    return if draw? || winner_profile_id.blank?

    errors.add(:winner_profile_id, "must have a profile in this organization") unless winner_profile&.organization_id == leaderboard.organization_id
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
