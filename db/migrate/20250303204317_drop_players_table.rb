class DropPlayersTable < ActiveRecord::Migration[7.0]
  def up
    # Ensure we remove all constraints before dropping the table
    execute "ALTER TABLE matches DROP CONSTRAINT IF EXISTS fk_rails_52a10c485c"
    execute "ALTER TABLE matches DROP CONSTRAINT IF EXISTS fk_rails_0f83f5f320"
    execute "ALTER TABLE matches DROP CONSTRAINT IF EXISTS fk_rails_9d0deeb219"
    execute "ALTER TABLE match_requests DROP CONSTRAINT IF EXISTS fk_rails_6409b80536"
    execute "ALTER TABLE match_requests DROP CONSTRAINT IF EXISTS fk_rails_4f06af48cb"

    # Now we can safely drop the table
    drop_table :players, if_exists: true
  end

  def down
    # Recreate the players table in case of rollback
    create_table :players do |t|
      t.references :user, null: false, foreign_key: true
      t.references :gym, null: false, foreign_key: true
      t.integer :elo, default: 1500
      t.timestamps
    end

    # Restore foreign keys (if needed)
    add_foreign_key :matches, :players, column: :player1_id
    add_foreign_key :matches, :players, column: :player2_id
    add_foreign_key :matches, :players, column: :winner_id
    add_foreign_key :match_requests, :players, column: :challenger_id
    add_foreign_key :match_requests, :players, column: :opponent_id
  end
end
