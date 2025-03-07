class RemoveBeltRankFromUsers < ActiveRecord::Migration[7.1]
  def change
    remove_column :users, :belt_rank, :string
  end
end
