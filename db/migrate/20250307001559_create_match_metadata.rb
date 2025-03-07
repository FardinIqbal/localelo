class CreateMatchMetadata < ActiveRecord::Migration[7.1]
  def change
    create_table :match_metadata do |t|
      t.references :match, null: false, foreign_key: true  # This already adds an index
      t.jsonb :data, default: {}
      t.timestamps
    end
  end
end
