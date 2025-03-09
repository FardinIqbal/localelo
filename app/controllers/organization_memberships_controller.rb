class OrganizationMembershipsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization, only: [:create]

  # POST /organization_memberships
  # Sends a join request for an organization
  def create
    if @organization.organization_memberships.exists?(user_id: current_user.id)
      flash[:alert] = "You are already a member of this organization."
    else
      @membership = @organization.organization_memberships.new(user: current_user, approved: false)

      if @membership.save
        flash[:notice] = "Join request sent for approval."
      else
        flash[:alert] = "Failed to send join request."
      end
    end
    redirect_to @organization
  end

  # DELETE /organization_memberships/:id
  # Allows a user to leave an organization
  def destroy
    membership = current_user.organization_memberships.find_by(id: params[:id])

    if membership
      membership.destroy
      flash[:notice] = "You have successfully left the organization."
    else
      flash[:alert] = "You are not a member of this organization."
    end

    redirect_to organizations_path
  end

  # GET /organization_memberships
  # Shows all organizations the current user is a member of
  def index
    @memberships = current_user.organization_memberships.includes(:organization)
  end

  private

  # Finds organization for create action
  def set_organization
    @organization = Organization.find_by!(id: params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end
end
