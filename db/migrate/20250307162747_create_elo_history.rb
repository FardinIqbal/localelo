class CreateEloHistory < ActiveRecord::Migration[7.1]
  def change
    create_table :elo_history do |t|
      t.bigint :user_id, null: false
      t.bigint :leaderboard_id, null: false
      t.integer :elo, null: false
      t.datetime :recorded_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }

      t.index [:user_id, :leaderboard_id, :recorded_at], name: "index_elo_history_on_user_and_leaderboard"
    end

    add_foreign_key :elo_history, :users
    add_foreign_key :elo_history, :leaderboards
  end
end
