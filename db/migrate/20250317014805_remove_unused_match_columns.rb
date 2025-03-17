class RemoveUnusedMatchColumns < ActiveRecord::Migration[7.1]
  def change
    remove_column :matches, :submission, :string, if_exists: true
    remove_column :matches, :match_metadata_id, :bigint, if_exists: true
  end
end
