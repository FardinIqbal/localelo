class Match < ApplicationRecord
  # Associations
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User"
  belongs_to :leaderboard
  has_one :match_metadata, dependent: :destroy
  has_many :linkflairs, dependent: :destroy

  # Validations to ensure all necessary data is provided
  validates :user1_id, presence: true
  validates :opponent_id, presence: true
  validates :leaderboard_id, presence: true

  # Ensure winner_id is either one of the players or nil (for a draw)
  validate :winner_must_be_valid

  private

  def winner_must_be_valid
    return if winner_id.nil? # Allow matches without a winner (TBD or Draw)

    unless [user1_id, opponent_id].include?(winner_id)
      errors.add(:winner_id, "must be either Player 1, Opponent, or left blank for a draw")
    end
  end
end
