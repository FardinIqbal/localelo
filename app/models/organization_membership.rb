# app/models/organization_membership.rb
class OrganizationMembership < ApplicationRecord
  # == Associations ==
  belongs_to :profile
  belongs_to :organization
  has_one :user, through: :profile
  has_one :organization_role, dependent: :destroy

  # == Enums ==
  # Define status values with meaningful names
  # pending (0): User has requested to join but not yet approved
  # approved (1): User is an active member of the organization
  # banned (2): User has been banned from the organization
  enum status: { pending: 0, approved: 1, banned: 2 }, _default: :pending

  # == Validations ==
  validates :status, inclusion: { in: statuses.keys }
  validates :profile_id, uniqueness: {
    scope: :organization_id,
    message: "User is already a member of this organization"
  }
  before_validation :assign_user_from_profile, if: -> { profile.present? && has_attribute?(:user_id) }

  after_update :remove_role_if_not_active, if: :saved_change_to_status?

  # == Scopes ==
  # Convenience scopes for common queries
  scope :admins, lambda {
    joins(:organization_role)
      .merge(OrganizationRole.admins)
  }
  scope :members, -> { where(status: :approved) }
  scope :banned_users, -> { where(status: :banned) }
  scope :active, -> { where(status: :approved) }
  scope :by_organization, ->(org_id) { where(organization_id: org_id) }
  scope :by_profile, ->(profile_id) { where(profile_id: profile_id) }
  scope :by_user, ->(user_id) {
    joins(:profile).where(profiles: { user_id: user_id })
  }

  # == Instance Methods ==
  # Predicate methods for checking membership status
  def pending?
    status == "pending"
  end

  def approved?
    status == "approved"
  end

  def banned?
    status == "banned"
  end

  # Check if user is an admin of the organization
  def admin?
    organization_role&.admin? || false
  end

  def owner?
    organization_role&.owner? || false
  end

  # Promote a user to admin status
  def promote_to_admin!
    role = organization_role || build_organization_role(organization: organization)
    role.update!(admin: true)
  end

  # Demote a user from admin status
  def demote_from_admin!
    return if organization_role&.owner?

    organization_role&.destroy
  end

  # Approve a pending membership
  def approve!
    update!(status: :approved)
  end

  # Ban a user from the organization
  def ban!
    update!(status: :banned)
  end

  private

  def assign_user_from_profile
    self.user_id = profile.user_id
  end

  def remove_role_if_not_active
    return if approved?

    organization_role&.destroy
  end
end
