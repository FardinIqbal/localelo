class AddLeaderboardToLinkflairs < ActiveRecord::Migration[7.1]
  def change
    add_column :linkflairs, :leaderboard_id, :bigint, null: false, default: 0
    add_index :linkflairs, :leaderboard_id
    add_foreign_key :linkflairs, :leaderboards
  end
end
