class AddApprovedToOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    add_column :organization_memberships, :approved, :boolean, default: false, null: false
  end
end
