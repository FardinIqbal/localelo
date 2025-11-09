class AddProfileToEloHistories < ActiveRecord::Migration[7.0]
  class MigrationEloHistory < ApplicationRecord
    self.table_name = "elo_histories"
    belongs_to :leaderboard, class_name: "AddProfileToEloHistories::MigrationLeaderboard"
  end

  class MigrationLeaderboard < ApplicationRecord
    self.table_name = "leaderboards"
  end

  class MigrationProfile < ApplicationRecord
    self.table_name = "profiles"
  end

  def up
    add_reference :elo_histories, :profile, null: true, index: true, foreign_key: true

    MigrationEloHistory.reset_column_information

    say_with_time "Backfilling Elo history profiles" do
      MigrationEloHistory.includes(:leaderboard).find_each do |history|
        organization_id = history.leaderboard.organization_id
        profile = MigrationProfile.find_by(user_id: history.user_id, organization_id: organization_id)
        unless profile
          raise ActiveRecord::RecordNotFound, "Profile missing for user #{history.user_id} in organization #{organization_id}"
        end

        history.update_columns(profile_id: profile.id)
      end
    end

    change_column_null :elo_histories, :profile_id, false
    add_index :elo_histories, [:profile_id, :leaderboard_id, :recorded_at], name: "index_elo_history_on_profile_and_leaderboard"

    remove_index :elo_histories, [:user_id, :leaderboard_id, :recorded_at]
    remove_reference :elo_histories, :user, foreign_key: true
  end

  def down
    add_reference :elo_histories, :user, null: true, index: true, foreign_key: true

    MigrationEloHistory.reset_column_information

    say_with_time "Restoring Elo history users" do
      MigrationEloHistory.includes(:leaderboard).find_each do |history|
        profile = MigrationProfile.find_by(id: history.profile_id)
        next unless profile

        history.update_columns(user_id: profile.user_id)
      end
    end

    change_column_null :elo_histories, :user_id, false
    add_index :elo_histories, [:user_id, :leaderboard_id, :recorded_at], name: "index_elo_history_on_user_and_leaderboard"

    remove_index :elo_histories, name: "index_elo_history_on_profile_and_leaderboard"
    remove_reference :elo_histories, :profile, foreign_key: true
  end
end
