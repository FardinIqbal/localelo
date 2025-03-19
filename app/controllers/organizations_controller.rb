class OrganizationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization, only: %i[show edit update destroy members approve_member leave join]
  before_action :authorize_owner!, only: %i[edit update destroy]
  before_action :authorize_admin!, only: %i[approve_member]

  # GET /organizations
  # Displays organizations the user can join with filtering options
  def index
    # Get organizations the user is already a member of (for "My Gyms" section)
    @my_organizations = current_user.organizations.includes(:leaderboards)
                                    .order(created_at: :desc)

    # Get organizations the user is NOT a part of (for discovery)
    joined_org_ids = current_user.organization_memberships.pluck(:organization_id)
    base_query = Organization.where.not(id: joined_org_ids)

    # Filter by visibility if provided
    if params[:visibility].present?
      @organizations = base_query.where(visibility: params[:visibility])
    else
      # Default to showing public organizations
      @organizations = base_query.where(visibility: :open)
    end

    # Additional filters
    @organizations = @organizations.where("name ILIKE ?", "%#{params[:query]}%") if params[:query].present?
    @organizations = @organizations.where("location ILIKE ?", "%#{params[:location]}%") if params[:location].present?

    # Sort options
    case params[:sort]
    when 'newest'
      @organizations = @organizations.order(created_at: :desc)
    when 'popular'
      @organizations = @organizations.left_joins(:organization_memberships)
                                     .group('organizations.id')
                                     .order('COUNT(organization_memberships.id) DESC')
    when 'alphabetical'
      @organizations = @organizations.order(:name)
    else
      # Default sort by newest
      @organizations = @organizations.order(created_at: :desc)
    end

    # Pagination
    @organizations = @organizations.page(params[:page]).per(12)

    # Popular organizations for sidebar
    @top_organizations = Organization.joins(:organization_memberships)
                                     .group("organizations.id")
                                     .order("COUNT(organization_memberships.id) DESC")
                                     .limit(5)

    # Stats for the view
    @total_organizations = Organization.count
    @total_members = OrganizationMembership.count
    @total_matches = Match.count

    respond_to do |format|
      format.html
      format.json { render json: @organizations }
    end
  end

  # GET /organizations/:id
  # Shows the organization, its leaderboards, and recent activity
  def show
    @leaderboards = @organization.leaderboards.order(created_at: :desc)
    @is_member = @organization.member?(current_user)
    @is_admin = @organization.admin?(current_user)
    @is_owner = @organization.owner?(current_user)
    @membership_status = @organization.membership_status(current_user)

    # Get recent matches for this organization
    @recent_matches = Match.joins(:leaderboard)
                           .where(leaderboards: { organization_id: @organization.id })
                           .order(created_at: :desc)
                           .limit(5)

    # Get top players in this organization
    @top_players = User.joins(leaderboard_ratings: :leaderboard)
                       .where(leaderboards: { organization_id: @organization.id })
                       .select("users.*, MAX(leaderboard_ratings.rating) as highest_rating")
                       .group("users.id")
                       .order("highest_rating DESC")
                       .limit(5)

    respond_to do |format|
      format.html
      format.json { render json: @organization.to_json(include: :leaderboards) }
    end
  end

  # GET /organizations/new
  # Renders the new organization form
  def new
    @organization = Organization.new
  end

  # POST /organizations
  # Creates a new organization and assigns the current user as the owner
  def create
    @organization = Organization.new(organization_params)
    @organization.user_id = current_user.id
    @organization.created_by = current_user.id

    respond_to do |format|
      if @organization.save
        # Auto-approve the owner as an admin
        @organization.organization_memberships.create!(
          user: current_user,
          status: "approved",
          admin: true
        )

        format.html {
          flash[:notice] = "#{@organization.name} has been successfully created!"
          redirect_to @organization
        }
        format.json { render json: @organization, status: :created }
      else
        format.html {
          flash.now[:alert] = @organization.errors.full_messages.to_sentence
          render :new, status: :unprocessable_entity
        }
        format.json { render json: @organization.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /organizations/:id/edit
  # Renders the edit form for an organization
  def edit
  end

  # PATCH/PUT /organizations/:id
  # Updates an organization (Only owner can edit)
  def update
    respond_to do |format|
      if @organization.update(organization_params)
        format.html {
          flash[:notice] = "Organization successfully updated."
          redirect_to @organization
        }
        format.json { render json: @organization, status: :ok }
      else
        format.html {
          flash.now[:alert] = @organization.errors.full_messages.to_sentence
          render :edit, status: :unprocessable_entity
        }
        format.json { render json: @organization.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /organizations/:id
  # Deletes an organization (Only owner can delete)
  def destroy
    name = @organization.name

    respond_to do |format|
      if @organization.destroy
        format.html {
          flash[:notice] = "#{name} has been permanently deleted."
          redirect_to organizations_path
        }
        format.json { head :no_content }
      else
        format.html {
          flash[:alert] = "Failed to delete organization: #{@organization.errors.full_messages.to_sentence}"
          redirect_to @organization
        }
        format.json { render json: @organization.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /organizations/:id/members
  # Shows a list of all members with filtering and sorting options
  def members
    @members_query = @organization.organization_memberships.includes(:user)

    # Filter by status if provided
    @members_query = @members_query.where(status: params[:status]) if params[:status].present?

    # Filter by search term
    if params[:query].present?
      @members_query = @members_query.joins(:user)
                                     .where("users.username ILIKE ? OR users.email ILIKE ?",
                                            "%#{params[:query]}%", "%#{params[:query]}%")
    end

    # Sort options
    case params[:sort]
    when 'newest'
      @members_query = @members_query.order(created_at: :desc)
    when 'alphabetical'
      @members_query = @members_query.joins(:user).order('users.username')
    when 'status'
      @members_query = @members_query.order(:status)
    else
      # Default sort by status then created_at
      @members_query = @members_query.order(:status, created_at: :desc)
    end

    # Pagination
    @members = @members_query.page(params[:page]).per(20)

    # Stats for the view
    @members_count = @organization.organization_memberships.count
    @pending_count = @organization.organization_memberships.where(status: :pending).count
    @admin_count = @organization.organization_memberships.where(admin: true).count

    respond_to do |format|
      format.html
      format.json { render json: @members }
    end
  end

  # POST /organizations/:id/join
  # Handles joining an organization (Auto-joins public, Requests private)
  def join
    membership = @organization.organization_memberships.find_or_initialize_by(user: current_user)

    respond_to do |format|
      if membership.persisted?
        format.html {
          flash[:alert] = "You are already a member or have a pending request."
          redirect_to @organization
        }
        format.json { render json: { error: "Already a member" }, status: :conflict }
      else
        membership.status = @organization.visibility == "open" ? :approved : :pending

        if membership.save
          message = @organization.visibility == "open" ?
                      "You have joined #{@organization.name}!" :
                      "Your request to join #{@organization.name} has been submitted and is pending approval."

          format.html {
            flash[:notice] = message
            redirect_to @organization
          }
          format.json { render json: membership, status: :created }
        else
          format.html {
            flash[:alert] = "Failed to join: #{membership.errors.full_messages.to_sentence}"
            redirect_to @organization
          }
          format.json { render json: membership.errors, status: :unprocessable_entity }
        end
      end
    end
  end

  # PATCH /organizations/:id/approve_member
  # Approves a user's request to join the organization (Admin only)
  def approve_member
    membership = @organization.organization_memberships.find_by(user_id: params[:user_id], status: :pending)

    respond_to do |format|
      if membership&.update(status: :approved)
        format.html {
          flash[:notice] = "#{membership.user.username} has been approved to join #{@organization.name}."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: membership, status: :ok }
      else
        format.html {
          flash[:alert] = "User not found or already approved."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "User not found or already approved" }, status: :not_found }
      end
    end
  end

  # DELETE /organizations/:id/leave
  # Allows a user to leave an organization (Owner must transfer ownership first)
  def leave
    membership = @organization.organization_memberships.find_by(user_id: current_user.id)

    respond_to do |format|
      if membership
        if @organization.owner?(current_user)
          format.html {
            flash[:alert] = "As the owner, you cannot leave #{@organization.name}. Transfer ownership first or delete the organization."
            redirect_to @organization
          }
          format.json { render json: { error: "Owners cannot leave" }, status: :forbidden }
        else
          membership.destroy
          format.html {
            flash[:notice] = "You have left #{@organization.name}."
            redirect_to organizations_path
          }
          format.json { head :no_content }

          # Check if organization is now empty
          @organization.destroy_if_empty
        end
      else
        format.html {
          flash[:alert] = "You are not a member of this organization."
          redirect_to organizations_path
        }
        format.json { render json: { error: "Not a member" }, status: :not_found }
      end
    end
  end

  private

  # Strong Parameters - Controls what can be updated
  def organization_params
    params.require(:organization).permit(:name, :description, :location, :website, :visibility, :slug)
  end

  # Finds the organization based on the ID param
  def set_organization
    @organization = Organization.find_by(id: params[:id]) || Organization.find_by(slug: params[:id])

    unless @organization
      respond_to do |format|
        format.html {
          flash[:alert] = "Organization not found."
          redirect_to organizations_path
        }
        format.json { render json: { error: "Organization not found" }, status: :not_found }
      end
    end
  end

  # Ensures the current user is the owner
  def authorize_owner!
    unless @organization.owner?(current_user)
      respond_to do |format|
        format.html {
          flash[:alert] = "Only the owner can perform this action."
          redirect_to @organization
        }
        format.json { render json: { error: "Unauthorized" }, status: :forbidden }
      end
    end
  end

  # Ensures the current user is an admin
  def authorize_admin!
    unless @organization.admin?(current_user)
      respond_to do |format|
        format.html {
          flash[:alert] = "You need admin privileges to perform this action."
          redirect_to @organization
        }
        format.json { render json: { error: "Unauthorized" }, status: :forbidden }
      end
    end
  end
end
