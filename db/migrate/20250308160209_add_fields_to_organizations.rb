class AddFieldsToOrganizations < ActiveRecord::Migration[7.1]
  def change
    add_column :organizations, :description, :text
    add_column :organizations, :location, :string
    add_column :organizations, :website, :string
    add_column :organizations, :visibility, :integer
    add_column :organizations, :created_by, :bigint
  end
end
