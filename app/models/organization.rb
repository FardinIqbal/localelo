class Organization < ApplicationRecord
  has_many :profiles, dependent: :destroy
  has_many :organization_memberships, dependent: :destroy
  has_many :membership_profiles, through: :organization_memberships, source: :profile
  has_many :users, through: :profiles
  has_many :leaderboards, dependent: :destroy
  has_many :matches, through: :leaderboards

  enum visibility: { open: 0, restricted: 1 }

  validates :name, presence: true

  # Check if a user is the owner
  def owner?(user)
    return false unless user

    organization_memberships.exists?(user_id: user.id, is_owner: true)
  end

  # Check if a user is an admin (either the owner or an admin via membership)
  def admin?(user)
    return false unless user

    # The owner should ALWAYS be an admin. We can enforce this with a validation.
    # For now, the check is simpler:
    organization_memberships.exists?(user_id: user.id, admin: true, status: :approved)
  end

  # Get the membership status of a user (nil, pending, approved)
  def membership_status(user)
    return nil unless user

    membership_for(user)&.status
  end

  # Promote a user to admin (Only the owner can do this)
  def promote_to_admin(user)
    return false unless user && !owner?(user)

    membership = membership_for(user, scope: :approved)
    membership&.update(admin: true)
  end

  # Demote an admin to a regular member (Only the owner can do this)
  def demote_admin(user)
    return false unless user && !owner?(user)

    membership = membership_for(user, scope: :approved)
    membership&.update(admin: false)
  end

  # Transfer ownership to another admin (Only the current owner can do this)
  def transfer_ownership(new_owner)
    return false unless new_owner.present?
    return false unless admin?(new_owner) # Ensure new owner is an admin

    ActiveRecord::Base.transaction do
      current_owner_membership = organization_memberships.find_by(is_owner: true)
      current_owner_membership&.update!(is_owner: false)

      membership = membership_for(new_owner)
      membership ||= begin
        profile = profiles.find_or_initialize_by(user_id: new_owner.id)
        profile.username ||= new_owner.username
        profile.first_name ||= new_owner.first_name
        profile.last_name ||= new_owner.last_name
        profile.save!

        organization_memberships.find_or_initialize_by(profile: profile)
      end

      membership.update!(admin: true, status: :approved, is_owner: true)

      update!(created_by: new_owner.id) if has_attribute?(:created_by)
    end

    true
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotSaved
    false
  end

  # Get all admins of the organization
  def admins
    membership_profiles.joins(:organization_memberships)
                       .merge(OrganizationMembership.where(organization_id: id, admin: true, status: :approved))
                       .map(&:user)
                       .compact
                       .uniq
  end

  # Check if a user is an approved member of the organization
  def member?(user)
    return false unless user

    organization_memberships.joins(:profile)
                             .where(profiles: { user_id: user.id }, status: :approved)
                             .exists?
  end

  # Get all approved members
  def approved_members
    membership_profiles.joins(:organization_memberships)
                       .merge(OrganizationMembership.where(organization_id: id, status: :approved))
  end

  # Get pending membership requests
  def pending_requests
    membership_profiles.joins(:organization_memberships)
                       .merge(OrganizationMembership.where(organization_id: id, status: :pending))
  end

  # Approve a membership request
  def approve_membership(user)
    return false unless user

    membership = membership_for(user, scope: :pending)
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
    profile_ids = matches.pluck(:profile1_id, :opponent_profile_id).flatten.compact.uniq
    Profile.where(id: profile_ids).includes(:user).map(&:user).compact
  end

  private

  def membership_for(user, scope: nil)
    relation = organization_memberships.joins(:profile).where(profiles: { user_id: user.id })
    relation = relation.public_send(scope) if scope && OrganizationMembership.respond_to?(scope)
    relation.first
  end

  def build_membership_for(user)
    profile = profiles.find_by(user_id: user.id)
    profile ||= profiles.build(user: user)
    organization_memberships.build(profile: profile)
  end
end
