class AddVerifiedToMatches < ActiveRecord::Migration[7.0]
  def change
    add_column :matches, :verified, :boolean, default: false, null: false
  end
end
