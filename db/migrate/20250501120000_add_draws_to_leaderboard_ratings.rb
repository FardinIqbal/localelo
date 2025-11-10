class AddDrawsToLeaderboardRatings < ActiveRecord::Migration[7.1]
  def change
    add_column :leaderboard_ratings, :draws, :integer, default: 0, null: false
  end
end
