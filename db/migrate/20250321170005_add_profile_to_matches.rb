class AddProfileToMatches < ActiveRecord::Migration[7.0]
  class MigrationMatch < ApplicationRecord
    self.table_name = "matches"
    belongs_to :leaderboard, class_name: "AddProfileToMatches::MigrationLeaderboard"
  end

  class MigrationLeaderboard < ApplicationRecord
    self.table_name = "leaderboards"
  end

  class MigrationProfile < ApplicationRecord
    self.table_name = "profiles"
  end

  def up
    add_reference :matches, :profile1, null: true, index: true, foreign_key: { to_table: :profiles }
    add_reference :matches, :opponent_profile, null: true, index: true, foreign_key: { to_table: :profiles }
    add_reference :matches, :winner_profile, null: true, index: true, foreign_key: { to_table: :profiles }

    MigrationMatch.reset_column_information

    say_with_time "Backfilling match profiles" do
      MigrationMatch.includes(:leaderboard).find_each do |match|
        organization_id = match.leaderboard.organization_id

        profile1 = profile_for(match.user1_id, organization_id)
        opponent_profile = profile_for(match.opponent_id, organization_id)
        winner_profile = match.winner_id ? profile_for(match.winner_id, organization_id) : nil

        match.update_columns(
          profile1_id: profile1.id,
          opponent_profile_id: opponent_profile.id,
          winner_profile_id: winner_profile&.id
        )
      end
    end

    change_column_null :matches, :profile1_id, false
    change_column_null :matches, :opponent_profile_id, false

    add_index :matches, [:profile1_id, :opponent_profile_id, :leaderboard_id], name: "index_matches_on_profile1_and_opponent_profile_and_leaderboard"

    remove_index :matches, [:user1_id, :opponent_id, :leaderboard_id]
    remove_index :matches, :user1_id
    remove_index :matches, :opponent_id
    remove_index :matches, :winner_id

    remove_reference :matches, :user1, foreign_key: { to_table: :users }
    remove_reference :matches, :opponent, foreign_key: { to_table: :users }
    remove_reference :matches, :winner, foreign_key: { to_table: :users }
  end

  def down
    add_reference :matches, :user1, null: true, index: true, foreign_key: { to_table: :users }
    add_reference :matches, :opponent, null: true, index: true, foreign_key: { to_table: :users }
    add_reference :matches, :winner, null: true, index: true, foreign_key: { to_table: :users }

    MigrationMatch.reset_column_information

    say_with_time "Restoring match user references" do
      MigrationMatch.includes(:leaderboard).find_each do |match|
        organization_id = match.leaderboard.organization_id

        profile1 = MigrationProfile.find_by(id: match.profile1_id)
        opponent_profile = MigrationProfile.find_by(id: match.opponent_profile_id)
        winner_profile = MigrationProfile.find_by(id: match.winner_profile_id)

        match.update_columns(
          user1_id: profile1&.user_id,
          opponent_id: opponent_profile&.user_id,
          winner_id: winner_profile&.user_id
        )
      end
    end

    change_column_null :matches, :user1_id, false
    change_column_null :matches, :opponent_id, false

    add_index :matches, [:user1_id, :opponent_id, :leaderboard_id]

    remove_index :matches, name: "index_matches_on_profile1_and_opponent_profile_and_leaderboard"
    remove_reference :matches, :profile1, foreign_key: { to_table: :profiles }
    remove_reference :matches, :opponent_profile, foreign_key: { to_table: :profiles }
    remove_reference :matches, :winner_profile, foreign_key: { to_table: :profiles }
  end

  private

  def profile_for(user_id, organization_id)
    profile = MigrationProfile.find_by(user_id: user_id, organization_id: organization_id)
    unless profile
      raise ActiveRecord::RecordNotFound, "Profile missing for user #{user_id} in organization #{organization_id}"
    end

    profile
  end
end
