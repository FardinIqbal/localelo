class RemoveSlugFromLeaderboards < ActiveRecord::Migration[7.1]
  def change
    remove_column :leaderboards, :slug, :string
  end
end
