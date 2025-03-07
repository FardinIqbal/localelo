class AddBeltRankToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :belt_rank, :string
  end
end
