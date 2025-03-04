class RenameMatchColumns < ActiveRecord::Migration[7.0]
  def change
    rename_column :matches, :player1_id, :user1_id
    rename_column :matches, :player2_id, :user2_id
  end
end
