class CreateEloHistories < ActiveRecord::Migration[7.1]
  def change
    create_table :elo_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :leaderboard, null: false, foreign_key: true
      t.integer :elo

      t.timestamps
    end
  end
end
