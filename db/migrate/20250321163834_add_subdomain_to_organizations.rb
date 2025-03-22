# Adds a 'subdomain' field to organizations so each org can be accessed via a unique subdomain
# (e.g., 'bjjfusion.localelo.com'). Index enforces uniqueness at the DB level.
class AddSubdomainToOrganizations < ActiveRecord::Migration[7.1]
  def change
    add_column :organizations, :subdomain, :string
    add_index :organizations, :subdomain, unique: true
  end
end
