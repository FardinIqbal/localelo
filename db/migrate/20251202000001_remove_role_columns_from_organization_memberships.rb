# frozen_string_literal: true

class RemoveRoleColumnsFromOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    if index_exists?(:organization_memberships, [:organization_id, :is_owner], name: "index_organization_memberships_on_organization_id_and_is_owner")
      remove_index :organization_memberships, name: "index_organization_memberships_on_organization_id_and_is_owner"
    end

    remove_column :organization_memberships, :admin, :boolean, default: false, null: false
    remove_column :organization_memberships, :is_owner, :boolean, default: false, null: false
  end
end
