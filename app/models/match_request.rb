class MatchRequest < ApplicationRecord
  belongs_to :challenger, class_name: "Player"
  belongs_to :opponent, class_name: "Player"
  belongs_to :gym

  enum status: { pending: "pending", accepted: "accepted", declined: "declined", expired: "expired" }

  validates :status, inclusion: { in: statuses.keys }
  validates :expires_at, presence: true
  validates :challenger_id, uniqueness: { scope: [:opponent_id, :gym_id, :status], message: "Match request already exists", conditions: -> { where(status: "pending") } }

  before_validation :set_expiration, on: :create

  scope :active, -> { pending.where("expires_at > ?", Time.current) }

  def self.expire_old_requests
    active.where("expires_at < ?", Time.current).update_all(status: "expired")
  end

  def cancel!
    update!(status: "expired") if pending?
  end

  private

  def set_expiration
    self.expires_at ||= 1.hour.from_now
  end
end
