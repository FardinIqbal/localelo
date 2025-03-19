class EloCalculatorService
  def self.adjust_ratings(match)
    new(match).adjust_ratings
  end
  
  def initialize(match)
    @match = match
    @player1 = match.user1
    @player2 = match.opponent
    @leaderboard = match.leaderboard
    @k_factor = 32 # Consider making this configurable per leaderboard
  end
  
  def adjust_ratings
    player1_rating = find_or_create_rating(@player1)
    player2_rating = find_or_create_rating(@player2)
    
    change = calculate_elo_change(player1_rating.rating, player2_rating.rating)
    
    ActiveRecord::Base.transaction do
      update_ratings(player1_rating, player2_rating, change)
    end
    
    true
  rescue => e
    Rails.logger.error "Elo adjustment failed: #{e.message}"
    false
  end
  
  private
  
  def find_or_create_rating(player)
    @leaderboard.leaderboard_ratings.find_or_create_by(user_id: player.id) do |r| 
      r.rating = 1500 
    end
  end
  
  def calculate_elo_change(rating_a, rating_b)
    outcome = @match.winner_id == @player1.id ? 1 : 0
    (@k_factor * (outcome - expected_score(rating_a, rating_b))).round
  end
  
  def expected_score(rating_a, rating_b)
    1.0 / (1.0 + 10**((rating_b - rating_a) / 400.0))
  end
  
  def update_ratings(player1_rating, player2_rating, change)
    if @match.winner_id == @player1.id
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
  end
end
