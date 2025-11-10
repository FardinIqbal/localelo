# frozen_string_literal: true

class CreateMatchParticipants < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  class LegacyMatch < ApplicationRecord
    self.table_name = "matches"
  end

  class LegacyMatchParticipant < ApplicationRecord
    self.table_name = "match_participants"
  end

  def up
    create_table :match_participants do |t|
      t.references :match, null: false, foreign_key: true
      t.references :profile, null: false, foreign_key: true
      t.integer :elo_before_match
      t.integer :elo_after_match
      t.boolean :is_winner, null: false, default: false

      t.timestamps
    end

    add_index :match_participants, [:match_id, :profile_id], unique: true, algorithm: :concurrently
    add_index :match_participants, :match_id, algorithm: :concurrently
    add_index :match_participants, :profile_id, algorithm: :concurrently

    say_with_time "Backfilling match participants" do
      LegacyMatch.reset_column_information

      LegacyMatch.find_each do |match|
        participants = []

        if match.respond_to?(:profile1_id) && match.profile1_id.present?
          participants << { profile_id: match.profile1_id, is_winner: match.winner_profile_id == match.profile1_id }
        end

        if match.respond_to?(:opponent_profile_id) && match.opponent_profile_id.present?
          participants << { profile_id: match.opponent_profile_id, is_winner: match.winner_profile_id == match.opponent_profile_id }
        end

        participants.each do |attrs|
          LegacyMatchParticipant.create!(attrs.merge(match_id: match.id))
        end
      end
    end

    safety_assured do
      remove_index :matches, name: "index_matches_on_profile1_and_opponent_profile_and_leaderboard", if_exists: true
      remove_index :matches, :profile1_id, if_exists: true
      remove_index :matches, :opponent_profile_id, if_exists: true

      remove_reference :matches, :profile1, foreign_key: { to_table: :profiles }, index: false
      remove_reference :matches, :opponent_profile, foreign_key: { to_table: :profiles }, index: false
      remove_column :matches, :elo_change, :integer
      remove_column :matches, :elo_at_time, :integer
    end
  end

  def down
    safety_assured do
      add_column :matches, :elo_change, :integer
      add_column :matches, :elo_at_time, :integer, null: false, default: 1500

      add_reference :matches, :profile1, null: false, index: true, foreign_key: { to_table: :profiles }
      add_reference :matches, :opponent_profile, null: false, index: true, foreign_key: { to_table: :profiles }

      add_index :matches, [:profile1_id, :opponent_profile_id, :leaderboard_id], name: "index_matches_on_profile1_and_opponent_profile_and_leaderboard"
    end

    drop_table :match_participants
  end
end
