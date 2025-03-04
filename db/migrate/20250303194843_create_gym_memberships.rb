class CreateGymMemberships < ActiveRecord::Migration[7.0]
  def change
    create_table :gym_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :gym, null: false, foreign_key: true
      t.integer :elo, default: 1500  # Default Elo when joining a gym

      t.timestamps
    end
  end
end
