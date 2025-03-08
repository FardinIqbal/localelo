class AddIsDrawToMatches < ActiveRecord::Migration[7.1]
  def change
    add_column :matches, :is_draw, :boolean, default: false, null: false
  end
end
