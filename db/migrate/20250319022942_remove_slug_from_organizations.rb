class RemoveSlugFromOrganizations < ActiveRecord::Migration[7.1]
  def change
    remove_column :organizations, :slug, :string
  end
end
