class OrganizationsController < ApplicationController
  before_action :authenticate_user!

  # Load organization for specific actions
  before_action :set_organization, only: [:show, :edit, :update, :destroy, :members, :approve_member, :leave]
  before_action :authorize_owner!, only: [:edit, :update, :destroy, :approve_member]

  # GET /organizations
  # Shows all organizations (for users to browse & join)
  def index
    @organizations = Organization.all
  end

  # GET /organizations/my
  # Shows only the organizations the current user is a member of
  def my_organizations
    @organizations = Organization.joins(:organization_memberships)
                                 .where(organization_memberships: { user_id: current_user.id })
  end

  # GET /organizations/:slug
  # Show details of a specific organization
  def show
    Rails.logger.info "Slug received: #{params[:slug]}"
    @leaderboards = @organization.leaderboards.order(created_at: :desc) # Load leaderboards for display
  end


  # GET /organizations/new
  # Render form to create a new organization
  def new
    @organization = Organization.new
  end

  # POST /organizations
  # Create a new organization and make the creator a member
  def create
    @organization = Organization.new(organization_params)
    @organization.user_id = current_user.id
    @organization.created_by = current_user.id

    if @organization.save
      @organization.organization_memberships.create(user: current_user)
      flash[:notice] = "Organization successfully created."
      redirect_to @organization
    else
      flash[:alert] = "Failed to create organization: " + @organization.errors.full_messages.to_sentence
      render :new, status: :unprocessable_entity
    end
  end

  # GET /organizations/:slug/edit
  def edit
  end

  # PATCH/PUT /organizations/:slug
  def update
    if @organization.update(organization_params)
      flash[:notice] = "Organization successfully updated."
      redirect_to @organization
    else
      flash[:alert] = "Failed to update organization: " + @organization.errors.full_messages.to_sentence
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /organizations/:slug
  # Destroy an organization if the owner chooses to delete it
  def destroy
    if @organization.destroy
      flash[:notice] = "Organization successfully deleted."
      redirect_to organizations_path
    else
      flash[:alert] = "Failed to delete organization."
      redirect_to @organization
    end
  end

  # GET /organizations/:slug/members
  # Show all members of the organization
  def members
    @members = @organization.users
  end

  # POST /organizations/:slug/join
  # Request to join an organization
  def join
    if @organization.organization_memberships.exists?(user_id: current_user.id)
      flash[:alert] = "You are already a member."
    else
      @organization.organization_memberships.create(user: current_user, approved: false)
      flash[:notice] = "Join request sent. An admin must approve your request."
    end
    redirect_to @organization
  end

  # PATCH /organizations/:slug/approve_member?user_id=ID
  # Approve a user’s membership request (Only Owners/Admins)
  def approve_member
    membership = @organization.organization_memberships.find_by(user_id: params[:user_id], approved: false)
    if membership
      membership.update(approved: true)
      flash[:notice] = "User approved successfully."
    else
      flash[:alert] = "User not found or already approved."
    end
    redirect_to members_organization_path(@organization)
  end

  # DELETE /organizations/:slug/leave
  # Allow users to leave an organization
  def leave
    membership = @organization.organization_memberships.find_by(user_id: current_user.id)

    if membership
      if @organization.user_id == current_user.id
        flash[:alert] = "Owners cannot leave their own organization. Transfer ownership or delete it."
      else
        membership.destroy
        flash[:notice] = "You have left the organization."
        check_and_destroy_organization
      end
    else
      flash[:alert] = "You are not a member of this organization."
    end

    redirect_to my_organizations_path
  end

  private

  # Strong parameters
  def organization_params
    params.require(:organization).permit(:name, :description, :location, :website, :visibility)
  end

  # Finds organization before actions
  def set_organization
    @organization = Organization.find_by(slug: params[:slug])
    unless @organization
      flash[:alert] = "Organization not found."
      redirect_to organizations_path
    end
  end

  # Ensure only owners can edit/update/delete
  def authorize_owner!
    unless @organization.user_id == current_user.id
      flash[:alert] = "You are not authorized to modify this organization."
      redirect_to organizations_path
    end
  end

  # Auto-delete organizations if no members remain
  def check_and_destroy_organization
    if @organization.organization_memberships.count.zero?
      @organization.destroy
      flash[:notice] = "Organization had no members left and was deleted."
    end
  end
end