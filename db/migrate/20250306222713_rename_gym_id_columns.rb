class RenameGymIdColumns < ActiveRecord::Migration[7.1]
  def change
    # organization_memberships table
    rename_column :organization_memberships, :gym_id, :organization_id

    # matches table (if you still need a direct reference to the org)
    rename_column :matches, :gym_id, :organization_id

    # Also fix foreign key constraints if they exist
    # If you had an FK named something like `fk_rails_12345` referencing :gyms,
    # you may need to remove and re-add the foreign key or rename it.
    # For example:
    # remove_foreign_key :organization_memberships, :gyms
    # add_foreign_key :organization_memberships, :organizations, column: :organization_id
  end
end
