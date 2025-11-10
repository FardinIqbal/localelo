class CreateProfiles < ActiveRecord::Migration[7.1]
  def change
    create_table :profiles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true
      t.string :username, null: false
      t.string :first_name
      t.string :last_name

      t.timestamps
    end

    add_index :profiles, [:organization_id, :username], unique: true
    add_index :profiles, [:organization_id, :user_id], unique: true
  end
end
