class OrganizationMembershipsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization, only: [:create]

  # POST /organization_memberships
  # Sends a join request for an organization
  def create
    membership = @organization.organization_memberships.find_or_initialize_by(user: current_user)

    if membership.persisted?
      flash[:alert] = "You are already a member of this organization."
    else
      membership.status = @organization.open? ? :approved : :pending
      if membership.save
        flash[:notice] = @organization.open? ? "You have joined the organization." : "Join request sent for approval."
      else
        flash[:alert] = "Failed to send join request."
      end
    end
    redirect_to organizations_path
  end

  # DELETE /organization_memberships/:id
  # Allows a user to leave an organization
  def destroy
    membership = current_user.organization_memberships.find_by(id: params[:id])

    if membership
      if membership.organization.owner?(current_user)
        flash[:alert] = "You cannot leave your own organization. Transfer ownership or delete it."
      else
        membership.destroy
        flash[:notice] = "You have successfully left the organization."
        membership.organization.destroy_if_empty # Cleanup if empty
      end
    else
      flash[:alert] = "You are not a member of this organization."
    end

    redirect_to organizations_path
  end

  # GET /organization_memberships
  # Shows all organizations the current user is a member of (Paginated)
  def index
    @memberships = current_user.organization_memberships.includes(:organization).page(params[:page])
  end

  private

  # Finds organization for create action
  def set_organization
    @organization = Organization.find_by(id: params[:organization_id])
    unless @organization
      flash[:alert] = "Organization not found."
      redirect_to organizations_path
    end
  end
end
