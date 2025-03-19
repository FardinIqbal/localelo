module HasMatches
  extend ActiveSupport::Concern
  
  included do
    has_many :matches_as_player1, class_name: 'Match', foreign_key: 'user1_id'
    has_many :matches_as_opponent, class_name: 'Match', foreign_key: 'opponent_id'
    has_many :matches_won, class_name: 'Match', foreign_key: 'winner_id'
  end
  
  def matches
    Match.where('user1_id = ? OR opponent_id = ?', id, id)
  end
  
  def win_percentage
    total = matches.count
    return 0 if total.zero?
    
    (matches_won.count.to_f / total * 100).round(1)
  end
end
