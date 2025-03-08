class AddDescriptionToLeaderboards < ActiveRecord::Migration[7.1]
  def change
    add_column :leaderboards, :description, :text
  end
end
