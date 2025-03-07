class RemoveEloFromOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    remove_column :organization_memberships, :elo, :integer
  end
end
