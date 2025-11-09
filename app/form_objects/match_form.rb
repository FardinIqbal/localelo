class MatchForm
  include ActiveModel::Model

  attr_accessor :leaderboard_id, :opponent_id, :winner_id, :user1_id, :is_draw
  attr_reader :match

  validates :leaderboard_id, :opponent_id, :user1_id, presence: true
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
      opponent_profile_id: profile_for_user(opponent_id)&.id,
      winner_profile_id: draw? ? nil : profile_for_user(winner_id)&.id,
      profile1_id: profile_for_user(user1_id)&.id,
      is_draw: draw?
    }
  end

  def draw?
    is_draw.to_s == "1"
  end

  def winner_or_draw_must_be_present
    if winner_id.blank? && !draw?
      errors.add(:base, "Either a winner must be selected or the match must be a draw")
    end
  end

  def winner_must_be_player
    return if winner_id.blank? || user1_id.blank? || opponent_id.blank? || draw?

    unless [user1_id.to_i, opponent_id.to_i].include?(winner_id.to_i)
      errors.add(:winner_id, "must be either Player 1 or Opponent")
    end
  end

  def opponent_must_be_in_leaderboard
    return if opponent_id.blank? || leaderboard_id.blank?

    unless profile_for_user(opponent_id)
      errors.add(:opponent_id, "must be a member of the selected leaderboard")
    end
  end

  def profiles_must_exist
    unless leaderboard
      errors.add(:leaderboard_id, "is not valid")
      return
    end

    errors.add(:user1_id, "does not have a profile in this organization") unless profile_for_user(user1_id)

    return if draw? || winner_id.blank?

    errors.add(:winner_id, "must have a profile in this organization") unless profile_for_user(winner_id)
  end

  def leaderboard
    @leaderboard ||= Leaderboard.find_by(id: leaderboard_id)
  end

  def profile_for_user(user_id)
    return nil if user_id.blank? || leaderboard.nil?

    @profile_cache ||= {}
    cache_key = user_id.to_i
    @profile_cache[cache_key] ||= Profile.find_by(user_id: cache_key, organization_id: leaderboard.organization_id)
  end
end
