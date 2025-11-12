class MatchParticipant < ApplicationRecord
  # == Associations ==
  belongs_to :match, inverse_of: :match_participants
  belongs_to :profile

  delegate :user, to: :profile

  # == Validations ==
  validates :match, :profile, presence: true
  validates :elo_before_match, :elo_after_match, numericality: { allow_nil: true, only_integer: true }
  validates :is_winner, inclusion: { in: [true, false] }

  scope :winners, -> { where(is_winner: true) }
  scope :losers, -> { where(is_winner: false) }

  def winner?
    is_winner
  end
end
