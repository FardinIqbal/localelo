# frozen_string_literal: true

class CreateOrganizationRoles < ActiveRecord::Migration[7.1]
  class MigrationOrganizationMembership < ActiveRecord::Base
    self.table_name = "organization_memberships"
  end

  class MigrationOrganizationRole < ActiveRecord::Base
    self.table_name = "organization_roles"
  end

  def up
    create_table :organization_roles do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :organization_membership, null: false, foreign_key: true, index: { name: "index_roles_on_membership" }
      t.boolean :admin, null: false, default: false
      t.boolean :owner, null: false, default: false
      t.timestamps
    end

    add_index :organization_roles,
              [:organization_id, :organization_membership_id],
              unique: true,
              name: "index_roles_on_org_and_membership"
    add_index :organization_roles,
              [:organization_id, :owner],
              unique: true,
              where: "owner = true",
              name: "index_organization_roles_on_org_and_owner"

    say_with_time "Migrating membership admin/owner flags to organization roles" do
      MigrationOrganizationMembership.reset_column_information
      MigrationOrganizationMembership.find_each do |membership|
        next unless membership.respond_to?(:admin) && membership.respond_to?(:is_owner)
        next unless membership.admin || membership.is_owner

        MigrationOrganizationRole.create!(
          organization_id: membership.organization_id,
          organization_membership_id: membership.id,
          admin: membership.admin || membership.is_owner,
          owner: membership.is_owner
        )
      end
    end
  end

  def down
    drop_table :organization_roles
  end
end
