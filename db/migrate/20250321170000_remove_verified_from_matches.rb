class RemoveVerifiedFromMatches < ActiveRecord::Migration[7.1]
  def change
    remove_column :matches, :verified, :boolean, default: false, null: false
  end
end
