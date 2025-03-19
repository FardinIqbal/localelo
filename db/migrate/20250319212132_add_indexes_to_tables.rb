class AddIndexesToTables < ActiveRecord::Migration[7.1]
  # In the migration file:
  def change
    # Add index for organization name searches
    add_index :organizations, :name

    # Add index for match time queries
    add_index :matches, :match_time

    # Add composite index for match lookups
    add_index :matches, [:user1_id, :opponent_id, :leaderboard_id]

    # Add index for username searches (already exists)
    # Add index for organization visibility filtering
    add_index :organizations, :visibility
  end
end
