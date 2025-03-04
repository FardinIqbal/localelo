class DropMatchRequestsTable < ActiveRecord::Migration[7.0]
  def up
    drop_table :match_requests, if_exists: true
  end

  def down
    create_table :match_requests do |t|
      t.references :gym, null: false, foreign_key: true
      t.references :challenger, null: false, foreign_key: { to_table: :users }
      t.references :opponent, null: false, foreign_key: { to_table: :users }
      t.string :status, default: "pending"
      t.timestamps
    end
  end
end
