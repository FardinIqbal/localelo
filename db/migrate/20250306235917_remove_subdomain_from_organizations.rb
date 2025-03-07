class RemoveSubdomainFromOrganizations < ActiveRecord::Migration[7.1]
  def change
    remove_column :organizations, :subdomain, :string
  end
end
