class RenameGymsToOrganizations < ActiveRecord::Migration[7.1]
  def change
    rename_table :gyms, :organizations
  end
end
