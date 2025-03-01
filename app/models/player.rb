# frozen_string_literal: true

class Player < ApplicationRecord
  belongs_to :user
  belongs_to :gym

  has_many :matches_as_player1, class_name: "Match", foreign_key: "player1_id", dependent: :destroy
  has_many :matches_as_player2, class_name: "Match", foreign_key: "player2_id", dependent: :destroy

  validates :elo, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
