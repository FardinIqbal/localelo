class MatchForm
  include ActiveModel::Model

  attr_accessor :leaderboard_id, :opponent_id, :winner_id, :user1_id, :is_draw
  attr_reader :match

  validates :leaderboard_id, :opponent_id, :user1_id, presence: true
  validate :winner_or_draw_must_be_present
  validate :winner_must_be_player
  validate :opponent_must_be_in_leaderboard

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
      opponent_id: opponent_id,
      winner_id: is_draw.to_s == "1" ? nil : winner_id,
      user1_id: user1_id,
      is_draw: is_draw.to_s == "1"
    }
  end

  def winner_or_draw_must_be_present
    if winner_id.blank? && is_draw.to_s != "1"
      errors.add(:base, "Either a winner must be selected or the match must be a draw")
    end
  end

  def winner_must_be_player
    return if winner_id.blank? || user1_id.blank? || opponent_id.blank? || is_draw.to_s == "1"

    unless [user1_id.to_i, opponent_id.to_i].include?(winner_id.to_i)
      errors.add(:winner_id, "must be either Player 1 or Opponent")
    end
  end

  def opponent_must_be_in_leaderboard
    return if opponent_id.blank? || leaderboard_id.blank?

    unless User.joins(:leaderboard_ratings)
               .where(leaderboard_ratings: { leaderboard_id: leaderboard_id })
               .exists?(id: opponent_id)
      errors.add(:opponent_id, "must be a member of the selected leaderboard")
    end
  end
end
