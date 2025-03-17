class DropUnusedTables < ActiveRecord::Migration[7.1]
  def change
    # Remove foreign key constraints before dropping tables
    remove_foreign_key :leaderboards, :sport_types if foreign_key_exists?(:leaderboards, :sport_types)
    remove_foreign_key :linkflairs, :sport_types if foreign_key_exists?(:linkflairs, :sport_types)

    # Remove foreign key from matches pointing to match_metadata
    remove_foreign_key :matches, :match_metadata if foreign_key_exists?(:matches, :match_metadata)

    # Drop tables
    drop_table :sport_types, if_exists: true
    drop_table :match_metadata, if_exists: true
    drop_table :linkflairs, if_exists: true
  end
end
