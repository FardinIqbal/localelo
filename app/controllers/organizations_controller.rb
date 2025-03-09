class OrganizationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization, only: %i[show edit update destroy members approve_member leave join]
  before_action :authorize_owner!, only: %i[edit update destroy approve_member]

  # GET /organizations
  # Shows only organizations the user is NOT a part of
  def index
    @organizations = Organization.left_joins(:organization_memberships)
                                 .where.not(organization_memberships: { user_id: current_user.id })
  end

  # GET /organizations/:id
  def show
    @leaderboards = @organization.leaderboards.order(created_at: :desc)
  end

  # GET /organizations/new
  def new
    @organization = Organization.new
  end

  # POST /organizations
  def create
    @organization = current_user.organizations.build(organization_params)

    if @organization.save
      @organization.organization_memberships.create(user: current_user, approved: true)
      flash[:notice] = "Organization successfully created."
      redirect_to @organization
    else
      flash[:alert] = "Failed to create organization: #{@organization.errors.full_messages.to_sentence}"
      render :new, status: :unprocessable_entity
    end
  end

  # GET /organizations/:id/edit
  def edit; end

  # PATCH/PUT /organizations/:id
  def update
    if @organization.update(organization_params)
      flash[:notice] = "Organization successfully updated."
      redirect_to @organization
    else
      flash[:alert] = "Failed to update organization: #{@organization.errors.full_messages.to_sentence}"
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /organizations/:id
  def destroy
    if @organization.destroy
      flash[:notice] = "Organization successfully deleted."
      redirect_to organizations_path
    else
      flash[:alert] = "Failed to delete organization."
      redirect_to @organization
    end
  end

  # GET /organizations/:id/members
  def members
    @members = @organization.users
  end

  # POST /organizations/:id/join
  # Handles joining an organization (instantly for public, request for private)
  def join
    unless @organization.organization_memberships.exists?(user_id: current_user.id)
      membership = @organization.organization_memberships.create(
        user: current_user, approved: @organization.visibility == "open"
      )

      if membership.persisted?
        flash[:notice] = @organization.visibility == "open" ? "You have joined the organization." : "Join request sent."
      else
        flash[:alert] = "Failed to join the organization."
      end
    else
      flash[:alert] = "You are already a member."
    end

    redirect_to organization_path(@organization)
  end

  # PATCH /organizations/:id/approve_member?user_id=ID
  # Approves a user’s request to join
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

  # DELETE /organizations/:id/leave
  # Allows a user to leave an organization
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

    redirect_to organizations_path
  end

  private

  def organization_params
    params.require(:organization).permit(:name, :description, :location, :website, :visibility)
  end

  def set_organization
    @organization = Organization.find_by!(id: params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end

  def authorize_owner!
    unless @organization.user_id == current_user.id
      flash[:alert] = "You are not authorized to modify this organization."
      redirect_to organizations_path
    end
  end

  # Deletes organization if no members are left
  def check_and_destroy_organization
    if @organization.organization_memberships.count.zero?
      @organization.destroy
      flash[:notice] = "Organization had no members left and was deleted."
    end
  end
end
