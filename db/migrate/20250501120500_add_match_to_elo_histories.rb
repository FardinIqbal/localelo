class AddMatchToEloHistories < ActiveRecord::Migration[7.1]
  def change
    add_reference :elo_histories, :match, foreign_key: true
  end
end
