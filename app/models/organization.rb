class Organization < ApplicationRecord
  belongs_to :user # The owner of the organization
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :leaderboards, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true
end
