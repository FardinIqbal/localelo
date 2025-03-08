class OrganizationMembershipsController < ApplicationController
  # Ensure only authenticated users can interact with organization memberships
  before_action :authenticate_user!

  # POST /organization_memberships
  # This action is used to send a join request for an organization
  def create
    @organization = Organization.find(params[:organization_id])

    # Check if the user is already a member
    if @organization.users.include?(current_user)
      flash[:alert] = "You are already a member of this organization."
      redirect_to organization_path(@organization) and return
    end

    # Create a new membership request with a pending status
    @membership = Membership.create(user: current_user, organization: @organization, status: :pending)

    if @membership.save
      flash[:notice] = "Join request sent to the organization owner for approval."
      redirect_to organization_path(@organization)
    else
      flash[:alert] = "Failed to send join request."
      redirect_to organization_path(@organization)
    end
  end

  # DELETE /organization_memberships/:id
  # This action is used to leave an organization
  def destroy
    @membership = Membership.find(params[:id])

    # Ensure the current user is the one who is leaving the organization
    if @membership.user == current_user
      @membership.destroy
      flash[:notice] = "You have successfully left the organization."
    else
      flash[:alert] = "You can only leave organizations you are a member of."
    end
    redirect_to organizations_path
  end

  # GET /organization_memberships
  # This action displays all the organizations the current user is a member of
  def index
    @memberships = current_user.memberships.includes(:organization)
  end
end
