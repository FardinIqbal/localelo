class AddEloChangeToMatches < ActiveRecord::Migration[7.1]
  def change
    add_column :matches, :elo_change, :integer
  end
end
