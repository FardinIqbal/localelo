class Match < ApplicationRecord
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User", foreign_key: "opponent_id"
  belongs_to :leaderboard
  belongs_to :winner, class_name: "User", foreign_key: "winner_id"

  validates :user1_id, :opponent_id, :leaderboard_id, :winner_id, presence: true
  validates :winner_id, inclusion: { in: ->(match) { [match.user1_id, match.opponent_id] },
                                     message: "must be either Player 1 or Opponent" }
  validates :user1_id, comparison: { other_than: :opponent_id, 
                                     message: "cannot play against themselves" }
  
  # Add scopes for common queries
  scope :recent, -> { order(created_at: :desc) }
  scope :by_leaderboard, ->(leaderboard_id) { where(leaderboard_id: leaderboard_id) }
  scope :involving_user, ->(user_id) { where("user1_id = ? OR opponent_id = ?", user_id, user_id) }
  scope :won_by, ->(user_id) { where(winner_id: user_id) }
  
  # Add callback to handle rating adjustments
  after_create :adjust_ratings
  
  # Constants for ELO calculation
  K_FACTOR = 32
  DEFAULT_RATING = 1500
  
  private
  
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
    
    change = calculate_elo_change(player1_rating.rating, player2_rating.rating)
    
    ActiveRecord::Base.transaction do
      update_ratings(player1_rating, player2_rating, change)
    end
  rescue => e
    Rails.logger.error "Elo adjustment failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end
  
  def calculate_elo_change(rating_a, rating_b)
    outcome = winner_id == user1_id ? 1 : 0
    (K_FACTOR * (outcome - expected_score(rating_a, rating_b))).round
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
    
    # Log the rating changes
    Rails.logger.info "Match #{id}: #{user1.username} (#{player1_rating.rating - change} → #{player1_rating.rating}) vs " \
                      "#{opponent.username} (#{player2_rating.rating + change} → #{player2_rating.rating}), " \
                      "Winner: #{winner_id == user1_id ? user1.username : opponent.username}"
  end
end
