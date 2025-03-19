class OrganizationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization, except: [:index, :new, :create]
  before_action :authorize_admin!, only: [:edit, :update, :destroy, :approve_member]

  # GET /organizations
  def index
    @organizations = Organization.includes(:organization_memberships, :leaderboards)
                                 .order(created_at: :desc)
  end

  # GET /organizations/:id
  def show
    @leaderboards = @organization.leaderboards.includes(:leaderboard_ratings)
    @members = @organization.users.includes(:organization_memberships)
                            .where(organization_memberships: { status: :approved })
                            .order(created_at: :desc)
    @pending_members = @organization.users.includes(:organization_memberships)
                                    .where(organization_memberships: { status: :pending })
                                    .order(created_at: :desc)
  end

  # GET /organizations/new
  def new
    @organization = Organization.new
  end

  # POST /organizations
  def create
    @organization = Organization.new(organization_params)
    @organization.user = current_user
    @organization.created_by = current_user.id

    respond_to do |format|
      if @organization.save
        # Auto-add creator as an admin member
        membership = @organization.organization_memberships.create(
          user: current_user,
          status: :approved,
          admin: true
        )

        format.html {
          flash[:notice] = "#{@organization.name} was successfully created!"
          redirect_to @organization
        }
        format.json { render json: @organization, status: :created }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @organization.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /organizations/:id/edit
  def edit
  end

  # PATCH/PUT /organizations/:id
  def update
    respond_to do |format|
      if @organization.update(organization_params)
        format.html {
          flash[:notice] = "#{@organization.name} was successfully updated!"
          redirect_to @organization
        }
        format.json { render json: @organization, status: :ok }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @organization.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /organizations/:id
  def destroy
    name = @organization.name

    # Use transaction to ensure data consistency
    ActiveRecord::Base.transaction do
      # Delete all associated leaderboard ratings
      LeaderboardRating.where(leaderboard_id: @organization.leaderboard_ids).delete_all

      # Delete all associated matches
      Match.where(leaderboard_id: @organization.leaderboard_ids).delete_all

      # Delete all leaderboards
      @organization.leaderboards.destroy_all

      # Delete all memberships
      @organization.organization_memberships.destroy_all

      # Finally delete the organization
      @organization.destroy
    end

    respond_to do |format|
      format.html {
        flash[:notice] = "#{name} was successfully deleted."
        redirect_to organizations_path
      }
      format.json { head :no_content }
    end
  end

  # GET /organizations/:id/members
  def members
    @members = @organization.users.includes(:organization_memberships)
                            .where(organization_memberships: { status: :approved })
                            .order(created_at: :desc)
    @pending_members = @organization.users.includes(:organization_memberships)
                                    .where(organization_memberships: { status: :pending })
                                    .order(created_at: :desc)
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
          # Auto-add user to all leaderboards if they're approved immediately
          if membership.approved?
            add_user_to_leaderboards(current_user, @organization)
          end

          message = @organization.visibility == "open" ?
                      "You have joined #{@organization.name} and been added to all leaderboards!" :
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
  def approve_member
    membership = @organization.organization_memberships.find_by(user_id: params[:user_id], status: :pending)

    respond_to do |format|
      if membership&.update(status: :approved)
        # Add user to all leaderboards in the organization
        add_user_to_leaderboards(membership.user, @organization)

        format.html {
          flash[:notice] = "#{membership.user.username} has been approved to join #{@organization.name} and added to all leaderboards."
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
  def leave
    membership = @organization.organization_memberships.find_by(user: current_user)

    respond_to do |format|
      if !membership
        format.html {
          flash[:alert] = "You are not a member of this organization."
          redirect_to @organization
        }
        format.json { render json: { error: "Not a member" }, status: :not_found }
      elsif @organization.user_id == current_user.id
        format.html {
          flash[:alert] = "As the owner, you cannot leave this organization. You must delete it or transfer ownership first."
          redirect_to @organization
        }
        format.json { render json: { error: "Owner cannot leave" }, status: :unprocessable_entity }
      else
        # Use transaction to ensure data consistency
        ActiveRecord::Base.transaction do
          # Remove user from all leaderboards in the organization
          remove_user_from_leaderboards(current_user, @organization)

          # Delete the membership
          membership.destroy
        end

        format.html {
          flash[:notice] = "You have left #{@organization.name} and been removed from all leaderboards."
          redirect_to organizations_path
        }
        format.json { head :no_content }
      end
    end
  end

  # PATCH /organizations/:id/make_admin
  def make_admin
    membership = @organization.organization_memberships.find_by(user_id: params[:user_id], status: :approved)

    respond_to do |format|
      if membership&.update(admin: true)
        format.html {
          flash[:notice] = "#{membership.user.username} is now an admin of #{@organization.name}."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: membership, status: :ok }
      else
        format.html {
          flash[:alert] = "User not found or not an approved member."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "User not found or not approved" }, status: :not_found }
      end
    end
  end

  # PATCH /organizations/:id/remove_admin
  def remove_admin
    membership = @organization.organization_memberships.find_by(user_id: params[:user_id], admin: true)

    respond_to do |format|
      if membership&.user_id == @organization.user_id
        format.html {
          flash[:alert] = "Cannot remove admin status from the organization owner."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "Cannot remove owner's admin status" }, status: :unprocessable_entity }
      elsif membership&.update(admin: false)
        format.html {
          flash[:notice] = "#{membership.user.username} is no longer an admin of #{@organization.name}."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: membership, status: :ok }
      else
        format.html {
          flash[:alert] = "User not found or not an admin."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "User not found or not an admin" }, status: :not_found }
      end
    end
  end

  # DELETE /organizations/:id/remove_member
  def remove_member
    membership = @organization.organization_memberships.find_by(user_id: params[:user_id])

    respond_to do |format|
      if !membership
        format.html {
          flash[:alert] = "User is not a member of this organization."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "Not a member" }, status: :not_found }
      elsif membership.user_id == @organization.user_id
        format.html {
          flash[:alert] = "Cannot remove the organization owner."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "Cannot remove owner" }, status: :unprocessable_entity }
      else
        user = membership.user

        # Use transaction to ensure data consistency
        ActiveRecord::Base.transaction do
          # Remove user from all leaderboards in the organization
          remove_user_from_leaderboards(user, @organization)

          # Delete the membership
          membership.destroy
        end

        format.html {
          flash[:notice] = "#{user.username} has been removed from #{@organization.name} and all its leaderboards."
          redirect_to members_organization_path(@organization)
        }
        format.json { head :no_content }
      end
    end
  end

  private

  def set_organization
    @organization = Organization.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end

  def organization_params
    params.require(:organization).permit(:name, :description, :location, :website, :visibility)
  end

  def authorize_admin!
    unless current_user.id == @organization.user_id ||
      @organization.organization_memberships.exists?(user: current_user, admin: true, status: :approved)
      flash[:alert] = "You don't have permission to perform this action."
      redirect_to @organization
    end
  end

  # Helper method to add a user to all leaderboards in an organization
  def add_user_to_leaderboards(user, organization)
    organization.leaderboards.each do |leaderboard|
      leaderboard.leaderboard_ratings.find_or_create_by(user: user) do |rating|
        rating.rating = 1500 # Default ELO rating
        rating.wins = 0
        rating.losses = 0
      end
    end
  end

  # Helper method to remove a user from all leaderboards in an organization
  def remove_user_from_leaderboards(user, organization)
    # Find all leaderboard ratings for this user in this organization
    ratings = LeaderboardRating.joins(:leaderboard)
                               .where(user_id: user.id, leaderboards: { organization_id: organization.id })

    # Delete all the ratings
    ratings.destroy_all

    # Note: We're not deleting match history to preserve historical data
    # If you want to delete match history too, uncomment the following:
    # Match.where("(user1_id = ? OR opponent_id = ?) AND leaderboard_id IN (?)",
    #             user.id, user.id, organization.leaderboard_ids).destroy_all
  end
end
