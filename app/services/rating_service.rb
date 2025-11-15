# app/services/rating_service.rb

class RatingService
  # System-wide constant for Glicko-2
  TAU = 0.5

  def self.calculate_ratings(leaderboard, matches)
    new(leaderboard, matches).calculate_ratings
  end

  def initialize(leaderboard, matches)
    @leaderboard = leaderboard
    @matches = matches
    @rating_period = Glicko2::RatingPeriod.new
  end

  def calculate_ratings
    # Add players and matches to the rating period
    add_players_to_period
    add_matches_to_period

    # Generate the new ratings
    @rating_period.generate_next_period(TAU)

    # Update the leaderboard ratings in the database
    update_leaderboard_ratings
  end

  private

  def add_players_to_period
    profiles = @matches.map(&:profiles).flatten.uniq
    profiles.each do |profile|
      rating = profile.leaderboard_rating(@leaderboard)
      glicko_player = Glicko2::Player.new(rating.rating, rating.rating_deviation, rating.volatility)
      @rating_period.add_player(profile.id.to_s, glicko_player)
    end
  end

  def add_matches_to_period
    @matches.each do |match|
      winner_id = match.winner.id.to_s
      loser_id = match.loser.id.to_s
      @rating_period.add_result(winner_id, loser_id)
    end
  end

  def update_leaderboard_ratings
    @rating_period.players.each do |id, player|
      profile = Profile.find(id.to_i)
      rating = profile.leaderboard_rating(@leaderboard)

      # Create a history record
      RatingHistory.create!(
        profile: profile,
        leaderboard: @leaderboard,
        match: @matches.last, # This is a simplification, might need adjustment
        rating: player.rating,
        rating_deviation: player.rating_deviation,
        volatility: player.volatility
      )

      # Update the current rating
      rating.update!(
        rating: player.rating,
        rating_deviation: player.rating_deviation,
        volatility: player.volatility,
        last_rated_at: Time.current
      )
    end
  end
end
