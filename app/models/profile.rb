class Profile < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  has_one_attached :avatar

  validates :username, presence: true, uniqueness: { scope: :organization_id }
  validates :user_id, uniqueness: { scope: :organization_id, message: "can only have one profile per organization" }
end
