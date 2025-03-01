# frozen_string_literal: true

class Match < ApplicationRecord
  belongs_to :gym
  belongs_to :player1, class_name: "Player"
  belongs_to :player2, class_name: "Player"
  belongs_to :winner, class_name: "Player", optional: true

  validates :match_time, presence: true
  validates :submission, allow_nil: true, length: { maximum: 100 }
end
