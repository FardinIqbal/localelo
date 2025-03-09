class AddAdminToOrganizationMemberships < ActiveRecord::Migration[7.0]
  def change
    add_column :organization_memberships, :admin, :boolean, default: false, null: false
  end
end
