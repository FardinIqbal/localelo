class Organization < ApplicationRecord
  belongs_to :user  # The Owner
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :leaderboards, dependent: :destroy

  # Check if a user is the owner
  def owner?(user)
    user_id == user.id
  end

  # Check if a user is an admin (either the owner or promoted)
  def admin?(user)
    return false unless user
    owner?(user) || organization_memberships.exists?(user_id: user.id, admin: true)
  end

  # Promote a user to admin (Only the owner can do this)
  def promote_to_admin(user)
    return false if owner?(user)  # Owner is always an admin
    membership = organization_memberships.find_by(user_id: user.id)
    membership.update(admin: true) if membership
  end

  # Demote an admin to a regular member (Only the owner can do this)
  def demote_admin(user)
    return false if owner?(user)  # Owner cannot be demoted
    membership = organization_memberships.find_by(user_id: user.id)
    membership.update(admin: false) if membership
  end

  # Transfer ownership to another user (Only the current owner can do this)
  def transfer_ownership(new_owner)
    return false if new_owner == user  # Prevent self-transfer
    return false unless users.include?(new_owner)  # Ensure new owner is a member
    update(user_id: new_owner.id)
  end

  # Get all admins of the organization
  def admins
    users.joins(:organization_memberships).where(organization_memberships: { admin: true })
  end

  # Check if a user is a member of the organization
  def member?(user)
    users.exists?(user.id)
  end
end
