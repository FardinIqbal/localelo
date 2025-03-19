class MatchForm
  include ActiveModel::Model
  
  attr_accessor :leaderboard_id, :opponent_id, :winner_id, :user1_id
  
  validates :leaderboard_id, :opponent_id, :winner_id, :user1_id, presence: true
  validate :winner_must_be_player
  validate :opponent_must_be_in_leaderboard
  
  def save
    return false unless valid?
    
    match = Match.new(attributes)
    
    if match.save
      EloCalculatorService.adjust_ratings(match)
      true
    else
      errors.merge!(match.errors)
      false
    end
  end
  
  private
  
  def attributes
    {
      leaderboard_id: leaderboard_id,
      opponent_id: opponent_id,
      winner_id: winner_id,
      user1_id: user1_id
    }
  end
  
  def winner_must_be_player
    return if winner_id.blank? || user1_id.blank? || opponent_id.blank?
    
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
