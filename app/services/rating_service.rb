class RatingService
  def self.calculate_ratings(leaderboard, matches)
    process_leaderboard(leaderboard, matches: matches)
  end

  def self.process_match(match)
    process_leaderboard(match.leaderboard, matches: match.leaderboard.matches.active.where(rated_at: nil))
  end

  def self.process_leaderboard(leaderboard, matches: nil)
    Rating::Glicko2Processor.new(leaderboard: leaderboard, matches: matches).call
  end
end
