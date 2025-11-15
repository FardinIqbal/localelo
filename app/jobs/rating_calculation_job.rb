class RatingCalculationJob < ApplicationJob
  queue_as :default

  def perform(*_args)
    Leaderboard.find_each do |leaderboard|
      leaderboard.matches
                 .active
                 .where(rated_at: nil)
                 .includes(match_participants: :profile)
                 .find_each do |match|
        RatingService.process_match(match)
      end
    end
  end
end
