class CreateSportTypes < ActiveRecord::Migration[7.1]
  def change
    create_table :sport_types do |t|
      t.string :name, null: false  # e.g., "BJJ", "MMA", "Table Tennis"
      t.jsonb :metadata_template, default: {}  # Predefined match fields
      t.timestamps
    end
    add_index :sport_types, :name, unique: true
  end
end
