# Drops the unused 'elo_histories' table, since we're consolidating Elo tracking
# into the single 'elo_history' table going forward.
class DropEloHistories < ActiveRecord::Migration[7.1]
  def change
    drop_table :elo_histories do |t|
      t.bigint :user_id, null: false
      t.bigint :leaderboard_id, null: false
      t.integer :elo
      t.timestamps

      t.index :user_id
      t.index :leaderboard_id
    end
  end
end
