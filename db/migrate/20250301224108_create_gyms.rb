# frozen_string_literal: true

class CreateGyms < ActiveRecord::Migration[7.1]
  def change
    create_table :gyms do |t|
      t.string :name, null: false
      t.string :subdomain, null: false

      t.timestamps
    end

    # Correct way to enforce uniqueness
    add_index :gyms, :subdomain, unique: true
  end
end
