# app/jobs/rating_calculation_job.rb

class RatingCalculationJob < ApplicationJob
  queue_as :default

  def perform(*args)
    # This job will be triggered periodically (e.g., daily)
    # It will process all matches since the last rating period

    # For each leaderboard, calculate new ratings
    Leaderboard.find_each do |leaderboard|
      # Get all matches that have not been rated yet for this leaderboard
      # This assumes a 'rated_at' timestamp on the Match model, which we'll need to add.
      # For now, we'll just get all matches.
      matches = leaderboard.matches.where(rated_at: nil)

      next if matches.empty?

      RatingService.calculate_ratings(leaderboard, matches)

      # Mark matches as rated
      matches.update_all(rated_at: Time.current)
    end
  end
end