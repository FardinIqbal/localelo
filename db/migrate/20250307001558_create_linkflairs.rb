class CreateLinkflairs < ActiveRecord::Migration[7.1]
  def change
    create_table :linkflairs do |t|
      t.references :sport_type, null: false, foreign_key: true  # Ensures sport-specific tags
      t.string :category, null: false  # e.g., "submission", "takedown", "KO type"
      t.string :name, null: false  # e.g., "Triangle Choke", "Double Leg Takedown"
      t.integer :usage_count, default: 1  # Tracks frequency of usage
      t.timestamps
    end
    add_index :linkflairs, [:sport_type_id, :category, :name], unique: true
  end
end
