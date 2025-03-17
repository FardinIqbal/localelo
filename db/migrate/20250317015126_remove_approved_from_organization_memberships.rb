class RemoveApprovedFromOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    remove_column :organization_memberships, :approved, :boolean, if_exists: true
  end
end
