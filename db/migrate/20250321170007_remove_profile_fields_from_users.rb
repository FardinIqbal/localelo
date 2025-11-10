class RemoveProfileFieldsFromUsers < ActiveRecord::Migration[7.0]
  def change
    remove_column :users, :username, :string
    remove_column :users, :first_name, :string
    remove_column :users, :last_name, :string
  end
end
