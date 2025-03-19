class AddDefaultsToLeaderboardRatings < ActiveRecord::Migration[7.1]
  def change
    change_column_default :leaderboard_ratings, :wins, 0
    change_column_default :leaderboard_ratings, :losses, 0
    change_column_default :leaderboard_ratings, :rating, 1500
  end
end
