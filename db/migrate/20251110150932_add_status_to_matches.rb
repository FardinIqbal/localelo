class AddStatusToMatches < ActiveRecord::Migration[7.1]
  def change
    add_column :matches, :status, :integer, default: 0, null: false
    add_index :matches, :status
  end
end
