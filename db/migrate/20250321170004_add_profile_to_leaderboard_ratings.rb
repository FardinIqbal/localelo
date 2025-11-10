class AddProfileToLeaderboardRatings < ActiveRecord::Migration[7.0]
  class MigrationLeaderboard < ApplicationRecord
    self.table_name = "leaderboards"
  end

  class MigrationProfile < ApplicationRecord
    self.table_name = "profiles"
  end

  class MigrationLeaderboardRating < ApplicationRecord
    self.table_name = "leaderboard_ratings"
    belongs_to :leaderboard, class_name: "AddProfileToLeaderboardRatings::MigrationLeaderboard"
  end

  def up
    add_reference :leaderboard_ratings, :profile, null: true, index: true, foreign_key: true

    MigrationLeaderboardRating.reset_column_information

    say_with_time "Backfilling leaderboard rating profiles" do
      MigrationLeaderboardRating.includes(:leaderboard).find_each do |rating|
        organization_id = rating.leaderboard.organization_id
        profile = MigrationProfile.find_by(user_id: rating.user_id, organization_id: organization_id)
        unless profile
          raise ActiveRecord::RecordNotFound, "Profile missing for user #{rating.user_id} in organization #{organization_id}"
        end

        rating.update_columns(profile_id: profile.id)
      end
    end

    change_column_null :leaderboard_ratings, :profile_id, false
    add_index :leaderboard_ratings, [:profile_id, :leaderboard_id], unique: true

    remove_index :leaderboard_ratings, [:user_id, :leaderboard_id]
    remove_reference :leaderboard_ratings, :user, foreign_key: true
  end

  def down
    add_reference :leaderboard_ratings, :user, null: true, index: true, foreign_key: true

    MigrationLeaderboardRating.reset_column_information

    say_with_time "Restoring leaderboard rating users" do
      MigrationLeaderboardRating.includes(:leaderboard).find_each do |rating|
        profile = MigrationProfile.find_by(id: rating.profile_id)
        next unless profile

        rating.update_columns(user_id: profile.user_id)
      end
    end

    change_column_null :leaderboard_ratings, :user_id, false
    add_index :leaderboard_ratings, [:user_id, :leaderboard_id], unique: true

    remove_index :leaderboard_ratings, [:profile_id, :leaderboard_id]
    remove_reference :leaderboard_ratings, :profile, foreign_key: true
  end
end
