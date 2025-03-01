# frozen_string_literal: true

class MatchRequest < ApplicationRecord
  belongs_to :challenger, class_name: "Player", foreign_key: "challenger_id"
  belongs_to :opponent, class_name: "Player", foreign_key: "opponent_id"
  belongs_to :gym

  validates :status, inclusion: { in: %w[pending accepted declined] }
  validates :expires_at, presence: true

  scope :active, -> { where(status: "pending").where("expires_at > ?", Time.current) }
end
