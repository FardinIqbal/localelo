class RenameUser2ToOpponentInMatches < ActiveRecord::Migration[7.1]
  def change
    rename_column :matches, :user2_id, :opponent_id
  end
end
