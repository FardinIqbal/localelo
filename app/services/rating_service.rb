class RatingService
  # Processes the provided match (or matches) and updates ratings immediately.
  def self.calculate_ratings(_leaderboard, matches)
    Array(matches).each { |match| process_match(match) }
  end

  def self.process_match(match)
    MatchRatingProcessor.new(match).call
  end
end
