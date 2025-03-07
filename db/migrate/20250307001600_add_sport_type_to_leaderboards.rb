class AddSportTypeToLeaderboards < ActiveRecord::Migration[7.1]
  def change
    # Step 1: Add the column without NOT NULL constraint
    add_reference :leaderboards, :sport_type, null: true, foreign_key: true

    # Step 2: Assign a valid sport_type_id to existing leaderboards using raw SQL
    reversible do |dir|
      dir.up do
        sport_type_id = ActiveRecord::Base.connection.execute("SELECT id FROM sport_types WHERE name = 'BJJ' LIMIT 1").first&.fetch("id") ||
          ActiveRecord::Base.connection.execute("SELECT id FROM sport_types LIMIT 1").first&.fetch("id")

        if sport_type_id
          ActiveRecord::Base.connection.execute("UPDATE leaderboards SET sport_type_id = #{sport_type_id} WHERE sport_type_id IS NULL")
        else
          raise "No sport types exist! Create at least one sport type before running this migration."
        end
      end
    end

    # Step 3: Now enforce NOT NULL
    change_column_null :leaderboards, :sport_type_id, false
  end
end
