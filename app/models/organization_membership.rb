class OrganizationMembership < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  enum status: { pending: 0, approved: 1, banned: 2 }, _default: :pending  # Default status to "pending"

  validates :status, inclusion: { in: statuses.keys }
  validates :user_id, uniqueness: { scope: :organization_id, message: "User is already a member of this organization" }

  # Indexing for performance
  # In a migration: add_index :organization_memberships, [:organization_id, :user_id], unique: true

  # Scopes for cleaner queries
  scope :admins, -> { where(admin: true) }
  scope :members, -> { where(status: :approved) }
  scope :banned_users, -> { where(status: :banned) }

  # Check if a membership is pending
  def pending?
    status == "pending"
  end

  # Check if a membership is approved
  def approved?
    status == "approved"
  end

  # Check if a membership is banned
  def banned?
    status == "banned"
  end
end
