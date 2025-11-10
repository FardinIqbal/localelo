class AddIsOwnerToOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    add_column :organization_memberships, :is_owner, :boolean, default: false, null: false
    add_index :organization_memberships, [:organization_id, :is_owner], unique: true, where: "is_owner = true"
  end
end
