class RemoveSportTypeFromLeaderboards < ActiveRecord::Migration[7.1]
  def change
    remove_column :leaderboards, :sport_type_id, :bigint, if_exists: true
  end
end
