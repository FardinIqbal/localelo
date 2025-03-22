class RenameEloHistoryToEloHistories < ActiveRecord::Migration[7.1]
  def change
    rename_table :elo_history, :elo_histories
  end
end
