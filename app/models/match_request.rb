class MatchRequest < ApplicationRecord
  belongs_to :challenger, class_name: "Player"
  belongs_to :opponent, class_name: "Player"
  belongs_to :gym

  validates :status, inclusion: { in: %w[pending accepted declined expired] }
  validates :expires_at, presence: true

  scope :active, -> { where(status: "pending").where("expires_at > ?", Time.current) }

  # Automatically expire old match requests every hour
  def self.expire_old_requests
    where("expires_at < ?", Time.current).where(status: "pending").update_all(status: "expired")
  end
end
