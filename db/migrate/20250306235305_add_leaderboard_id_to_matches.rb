class AddLeaderboardIdToMatches < ActiveRecord::Migration[7.1]
  def change
    # Step 1: Add column WITHOUT NOT NULL constraint
    add_reference :matches, :leaderboard, null: true, foreign_key: true

    # Step 2: Assign default leaderboard to existing matches using raw SQL
    reversible do |dir|
      dir.up do
        organization_id = ActiveRecord::Base.connection.execute("SELECT id FROM organizations LIMIT 1").first&.fetch("id")

        if organization_id
          # Create a default leaderboard if none exists
          leaderboard_id = ActiveRecord::Base.connection.execute("INSERT INTO leaderboards (organization_id, name, slug, created_at, updated_at) VALUES (#{organization_id}, 'Default', 'default', NOW(), NOW()) RETURNING id").first&.fetch("id")

          # Assign this leaderboard ID to all existing matches
          ActiveRecord::Base.connection.execute("UPDATE matches SET leaderboard_id = #{leaderboard_id} WHERE leaderboard_id IS NULL")
        end
      end
    end

    # Step 3: Now enforce NOT NULL
    change_column_null :matches, :leaderboard_id, false
  end
end
