# Adds a 'sport' field to leaderboards to differentiate between different activities
# (e.g., BJJ, Table Tennis). Composite index speeds up org+sport queries.
class AddSportToLeaderboards < ActiveRecord::Migration[7.1]
  def change
    add_column :leaderboards, :sport, :string
    add_index :leaderboards, [:organization_id, :sport], name: "index_leaderboards_on_organization_and_sport"
  end
end
