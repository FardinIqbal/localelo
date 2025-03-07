class AddEloAndForeignKeysToMatches < ActiveRecord::Migration[7.1]
  def change
    add_column :matches, :elo_at_time, :integer, null: false, default: 1500

    add_foreign_key :matches, :users, column: :user1_id
    add_foreign_key :matches, :users, column: :opponent_id
    add_foreign_key :matches, :users, column: :winner_id
  end
end
