class AddStatusToOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    add_column :organization_memberships, :status, :integer, default: 0, null: false
  end
end
