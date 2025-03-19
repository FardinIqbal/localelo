class Organization < ApplicationRecord
  belongs_to :user, optional: true  # The Owner
  has_many :organization_memberships, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :leaderboards, dependent: :destroy
  has_many :matches, through: :leaderboards

  enum visibility: { open: 0, restricted: 1 }

  validates :name, presence: true

  # Check if a user is the owner
  def owner?(user)
    user_id == user&.id
  end

  # Check if a user is an admin (either the owner or an admin via membership)
  def admin?(user)
    return false unless user
    owner?(user) || organization_memberships.exists?(user_id: user.id, admin: true, status: :approved)
  end

  # Get the membership status of a user (nil, pending, approved)
  def membership_status(user)
    return nil unless user
    membership = organization_memberships.find_by(user_id: user.id)
    membership&.status
  end

  # Promote a user to admin (Only the owner can do this)
  def promote_to_admin(user)
    return false unless user && !owner?(user)
    membership = organization_memberships.find_by(user_id: user.id, status: :approved)
    membership&.update(admin: true)
  end

  # Demote an admin to a regular member (Only the owner can do this)
  def demote_admin(user)
    return false unless user && !owner?(user)
    membership = organization_memberships.find_by(user_id: user.id, status: :approved)
    membership&.update(admin: false)
  end

  # Transfer ownership to another admin (Only the current owner can do this)
  def transfer_ownership(new_owner)
    return false unless new_owner.present?
    return false unless admin?(new_owner) # Ensure new owner is an admin

    # Update the organization owner
    if update(user_id: new_owner.id)
      # Ensure the new owner has an approved membership with admin rights
      membership = organization_memberships.find_or_initialize_by(user_id: new_owner.id)
      membership.update(admin: true, status: :approved)
      return true
    end
    false
  end

  # Get all admins of the organization
  def admins
    users.joins(:organization_memberships)
         .where(organization_memberships: { organization_id: id, admin: true, status: :approved })
  end

  # Check if a user is an approved member of the organization
  def member?(user)
    return false unless user
    organization_memberships.exists?(user_id: user.id, status: :approved)
  end

  # Get all approved members
  def approved_members
    users.joins(:organization_memberships)
         .where(organization_memberships: { organization_id: id, status: :approved })
  end

  # Get pending membership requests
  def pending_requests
    users.joins(:organization_memberships)
         .where(organization_memberships: { organization_id: id, status: :pending })
  end

  # Approve a membership request
  def approve_membership(user)
    return false unless user
    membership = organization_memberships.find_by(user_id: user.id, status: :pending)
    membership&.update(status: :approved)
  end

  # Destroy the organization if it has no members
  def destroy_if_empty
    destroy if organization_memberships.none?
  end

  # Get total match count for the organization
  def total_matches
    matches.count
  end

  # Get active users (users who have played matches)
  def active_users
    user_ids = matches.pluck(:user1_id, :opponent_id).flatten.uniq
    User.where(id: user_ids)
  end
end
