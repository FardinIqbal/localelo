class MatchParticipant < ApplicationRecord
  # == Associations ==
  belongs_to :match, inverse_of: :match_participants
  belongs_to :profile

  delegate :user, to: :profile

  # == Validations ==
  validates :match, :profile, presence: true
  validates :is_winner, inclusion: { in: [true, false] }

  scope :winners, -> { where(is_winner: true) }
  scope :losers, -> { where(is_winner: false) }

  def winner?
    is_winner
  end

  def elo_change
    return nil unless rating_after_match && rating_before_match

    rating_after_match - rating_before_match
  end
end
