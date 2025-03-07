class CreateLeaderboardRatings < ActiveRecord::Migration[7.1]
  def change
    create_table :leaderboard_ratings do |t|
      t.references :user, null: false, foreign_key: true
      t.references :leaderboard, null: false, foreign_key: true
      t.integer :rating, default: 1500, null: false
      t.integer :wins, default: 0
      t.integer :losses, default: 0
      # Add other stats as needed
      t.timestamps
    end

    # Optionally ensure one rating row per user+leaderboard
    add_index :leaderboard_ratings, [:user_id, :leaderboard_id], unique: true
  end
end
