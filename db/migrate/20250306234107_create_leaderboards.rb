class CreateLeaderboards < ActiveRecord::Migration[7.1]
  def change
    create_table :leaderboards do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name, null: false  # e.g. “Gi”, “No-Gi”, “Blitz”, “Rapid”
      t.string :slug, null: false  # Short identifier: “gi”, “no-gi”
      t.timestamps
    end

    add_index :leaderboards, [:organization_id, :slug], unique: true
    # Ensures each org can’t have two leaderboards with the same slug
  end
end
