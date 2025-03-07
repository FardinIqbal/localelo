class RenameGymMembershipsToOrganizationMemberships < ActiveRecord::Migration[7.1]
  def change
    rename_table :gym_memberships, :organization_memberships
  end
end
