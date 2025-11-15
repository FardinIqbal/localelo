class AddGlicko2FieldsToMatchParticipants < ActiveRecord::Migration[7.1]
  def change
    remove_column :match_participants, :elo_before_match, :integer
    remove_column :match_participants, :elo_after_match, :integer
    add_column :match_participants, :rating_before_match, :float
    add_column :match_participants, :rating_deviation_before_match, :float
    add_column :match_participants, :volatility_before_match, :float
    add_column :match_participants, :rating_after_match, :float
    add_column :match_participants, :rating_deviation_after_match, :float
    add_column :match_participants, :volatility_after_match, :float
  end
end