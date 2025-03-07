class SetDefaultBeltRank < ActiveRecord::Migration[7.1]
  def change
    change_column_default :users, :belt_rank, "No Belt"
  end
end
