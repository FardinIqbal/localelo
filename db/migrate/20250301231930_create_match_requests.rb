class CreateMatchRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :match_requests do |t|
      t.references :challenger, null: false, foreign_key: { to_table: :players }
      t.references :opponent, null: false, foreign_key: { to_table: :players }
      t.references :gym, null: false, foreign_key: true
      t.string :status, default: "pending", null: false
      t.datetime :expires_at, null: false

      t.timestamps
    end
  end
end
