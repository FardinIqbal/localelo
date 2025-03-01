# frozen_string_literal: true

class CreateMatches < ActiveRecord::Migration[7.1]
  def change
    create_table :matches do |t|
      t.references :player1, null: false, foreign_key: { to_table: :players }
      t.references :player2, null: false, foreign_key: { to_table: :players }
      t.references :winner, foreign_key: { to_table: :players }
      t.references :gym, null: false, foreign_key: true
      t.string :match_time
      t.string :submission

      t.timestamps
    end
  end
end
