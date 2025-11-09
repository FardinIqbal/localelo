class AddProfileToOrganizationMemberships < ActiveRecord::Migration[7.0]
  class MigrationProfile < ApplicationRecord
    self.table_name = "profiles"
  end

  class MigrationOrganizationMembership < ApplicationRecord
    self.table_name = "organization_memberships"
  end

  class MigrationUser < ApplicationRecord
    self.table_name = "users"
  end

  def up
    add_reference :organization_memberships, :profile, null: true, index: true, foreign_key: true

    MigrationOrganizationMembership.reset_column_information

    say_with_time "Backfilling organization membership profiles" do
      MigrationOrganizationMembership.find_each do |membership|
        profile = MigrationProfile.find_by(user_id: membership.user_id, organization_id: membership.organization_id)
        unless profile
          raise ActiveRecord::RecordNotFound, "Profile missing for user #{membership.user_id} in organization #{membership.organization_id}"
        end

        membership.update_columns(profile_id: profile.id)
      end
    end

    change_column_null :organization_memberships, :profile_id, false
    remove_reference :organization_memberships, :user, foreign_key: true
  end

  def down
    add_reference :organization_memberships, :user, null: true, index: true, foreign_key: true

    MigrationOrganizationMembership.reset_column_information

    say_with_time "Restoring organization membership users" do
      MigrationOrganizationMembership.find_each do |membership|
        profile = MigrationProfile.find_by(id: membership.profile_id)
        next unless profile

        membership.update_columns(user_id: profile.user_id)
      end
    end

    change_column_null :organization_memberships, :user_id, false
    remove_reference :organization_memberships, :profile, foreign_key: true
  end
end
