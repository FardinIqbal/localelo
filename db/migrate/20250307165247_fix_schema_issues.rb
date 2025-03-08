class FixSchemaIssues < ActiveRecord::Migration[7.1]
  def change
    # Remove the existing foreign key first
    remove_foreign_key :matches, :match_metadata if foreign_key_exists?(:matches, :match_metadata)

    # Re-add the foreign key with ON DELETE CASCADE
    add_foreign_key :matches, :match_metadata, column: :match_metadata_id, on_delete: :cascade

    # Remove the old column (which had a default value) and re-add it properly
    remove_column :linkflairs, :leaderboard_id, :bigint if column_exists?(:linkflairs, :leaderboard_id)
    add_column :linkflairs, :leaderboard_id, :bigint, null: false

    # Add missing index for leaderboard ratings to optimize leaderboard sorting
    add_index :leaderboard_ratings, [:leaderboard_id, :rating], name: "index_leaderboard_ratings_on_leaderboard_id_and_rating"
  end
end
