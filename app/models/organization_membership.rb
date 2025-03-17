class OrganizationMembership < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  enum status: { pending: 0, approved: 1, banned: 2 }

  validates :status, inclusion: { in: statuses.keys }
end
