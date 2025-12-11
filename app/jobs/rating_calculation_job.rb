class RatingCalculationJob < ApplicationJob
  queue_as :default

  def perform(*_args)
    Leaderboard.find_each do |leaderboard|
      RatingService.process_leaderboard(leaderboard)
    end
  end
end
