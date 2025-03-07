class RemoveOrganizationIdFromMatches < ActiveRecord::Migration[7.1]
  def change
    remove_column :matches, :organization_id, :bigint
  end
end
