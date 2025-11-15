class CreateRatingHistories < ActiveRecord::Migration[7.1]
  def change
    create_table :rating_histories do |t|
      t.references :profile, null: false, foreign_key: true
      t.references :leaderboard, null: false, foreign_key: true
      t.references :match, null: false, foreign_key: true
      t.float :rating
      t.float :rating_deviation
      t.float :volatility

      t.timestamps
    end

    drop_table :elo_histories
  end
end