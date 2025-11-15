class AddRatedAtToMatches < ActiveRecord::Migration[7.1]
  def change
    add_column :matches, :rated_at, :datetime
  end
end