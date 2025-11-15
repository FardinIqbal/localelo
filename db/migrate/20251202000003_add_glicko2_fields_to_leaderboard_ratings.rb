class AddGlicko2FieldsToLeaderboardRatings < ActiveRecord::Migration[7.1]
  def change
    change_column :leaderboard_ratings, :rating, :float, default: 1500.0
    add_column :leaderboard_ratings, :rating_deviation, :float, default: 350.0
    add_column :leaderboard_ratings, :volatility, :float, default: 0.06
    add_column :leaderboard_ratings, :last_rated_at, :datetime
  end
end