class RemoveUserIdFromOrganizations < ActiveRecord::Migration[7.1]
  def change
    remove_reference :organizations, :user, foreign_key: true
  end
end
