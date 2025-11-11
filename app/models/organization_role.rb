# frozen_string_literal: true

class OrganizationRole < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_membership

  delegate :profile, :user, to: :organization_membership

  scope :admins, -> { where(admin: true) }
  scope :owners, -> { where(owner: true) }

  validates :organization, presence: true
  validates :organization_membership_id, uniqueness: true
  validates :admin, inclusion: { in: [true, false] }
  validates :owner, inclusion: { in: [true, false] }
  validate :membership_belongs_to_organization
  validate :membership_must_be_approved
  validate :single_owner, if: :owner?

  before_validation :sync_organization
  before_validation :ensure_admin_when_owner

  def owner?
    owner
  end

  def admin?
    admin || owner?
  end

  private

  def sync_organization
    self.organization_id ||= organization_membership&.organization_id
  end

  def membership_belongs_to_organization
    return if organization_membership.blank? || organization_id.blank?

    unless organization_membership.organization_id == organization_id
      errors.add(:organization_membership, "must belong to the same organization")
    end
  end

  def membership_must_be_approved
    return if organization_membership.blank?
    return if organization_membership.approved?

    errors.add(:organization_membership, "must be approved to assign roles")
  end

  def ensure_admin_when_owner
    self.admin = true if owner?
  end

  def single_owner
    return if organization_id.blank?

    scope = self.class.where(organization_id: organization_id, owner: true)
    scope = scope.where.not(id: id) if persisted?

    errors.add(:owner, "role already assigned for this organization") if scope.exists?
  end
end
