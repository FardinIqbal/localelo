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
    approved_memberships = @organization.organization_memberships.includes(profile: :user)
                                             .approved
                                             .order(created_at: :desc)
    pending_memberships = @organization.organization_memberships.includes(profile: :user)
                                            .pending
                                            .order(created_at: :desc)

    @member_memberships = approved_memberships
    @pending_member_memberships = pending_memberships
    @members = approved_memberships.map(&:profile)
    @pending_members = pending_memberships.map(&:profile)
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
        if ensure_owner_membership(@organization, current_user)
          format.html do
            flash[:notice] = "#{@organization.name} was successfully created!"
            redirect_to @organization
          end
          format.json { render json: @organization, status: :created }
        else
          format.html do
            flash.now[:alert] = @organization.errors.full_messages.to_sentence.presence || "Unable to finalize organization setup."
            render :new, status: :unprocessable_entity
          end
          format.json { render json: { errors: @organization.errors.full_messages }, status: :unprocessable_entity }
        end
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
    approved_memberships = @organization.organization_memberships.includes(profile: :user)
                                             .approved
                                             .order(created_at: :desc)
    pending_memberships = @organization.organization_memberships.includes(profile: :user)
                                            .pending
                                            .order(created_at: :desc)

    @member_memberships = approved_memberships
    @pending_member_memberships = pending_memberships
    @members = approved_memberships.map(&:profile)
    @pending_members = pending_memberships.map(&:profile)
  end

  # POST /organizations/:id/join
  # Handles joining an organization (Auto-joins public, Requests private)
  def join
    profile = current_user.profile_for(@organization)

    unless profile
      profile = current_user.profiles.build(
        organization: @organization,
        username: current_user.username,
        first_name: current_user.first_name,
        last_name: current_user.last_name
      )

      unless profile.save
        respond_to do |format|
          format.html do
            flash[:alert] = "Unable to create profile for this organization: #{profile.errors.full_messages.to_sentence}"
            redirect_to @organization
          end
          format.json { render json: { error: profile.errors.full_messages.to_sentence }, status: :unprocessable_entity }
        end
        return
      end
    end

    membership = @organization.organization_memberships.find_or_initialize_by(profile: profile)

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
    user = User.find_by(id: params[:user_id])

    unless user
      respond_to do |format|
        format.html {
          flash[:alert] = "User not found."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "User not found" }, status: :not_found }
      end
      return
    end

    profile = nil
    membership = nil

    begin
      ActiveRecord::Base.transaction do
        profile = user.profiles.find_or_initialize_by(organization: @organization)
        profile.username ||= user.username
        profile.first_name ||= user.first_name
        profile.last_name ||= user.last_name
        profile.save!

        membership = @organization.organization_memberships.find_or_initialize_by(profile: profile)
        membership.status = :approved
        membership.save!

        add_user_to_leaderboards(user, @organization)
      end

      respond_to do |format|
        format.html {
          flash[:notice] = "#{profile.username} has been approved to join #{@organization.name} and added to all leaderboards."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { membership: membership, profile: profile }, status: :ok }
      end
    rescue ActiveRecord::RecordInvalid => e
      respond_to do |format|
        format.html {
          flash[:alert] = e.record.errors.full_messages.to_sentence.presence || "Unable to approve member."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /organizations/:id/leave
  def leave
    membership = membership_for_user(current_user.id)

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
    membership = membership_for_user(params[:user_id], status: :approved)

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
    membership = membership_for_user(params[:user_id], admin: true)

    respond_to do |format|
      if membership&.user&.id == @organization.user_id
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
    membership = membership_for_user(params[:user_id])

    respond_to do |format|
      if !membership
        format.html {
          flash[:alert] = "User is not a member of this organization."
          redirect_to members_organization_path(@organization)
        }
        format.json { render json: { error: "Not a member" }, status: :not_found }
      elsif membership.user&.id == @organization.user_id
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
      @organization.organization_memberships.joins(:profile)
                     .where(profiles: { user_id: current_user.id }, admin: true, status: :approved)
                     .exists?
      flash[:alert] = "You don't have permission to perform this action."
      redirect_to @organization
    end
  end

  # Helper method to add a user to all leaderboards in an organization
  def add_user_to_leaderboards(user, organization)
    profile = user.profile_for(organization)
    return unless profile

    organization.leaderboards.each do |leaderboard|
      leaderboard.leaderboard_ratings.find_or_create_by(profile: profile) do |rating|
        rating.rating = 1500 # Default ELO rating
        rating.wins = 0
        rating.losses = 0
      end
    end
  end

  # Helper method to remove a user from all leaderboards in an organization
  def remove_user_from_leaderboards(user, organization)
    # Find all leaderboard ratings for this user in this organization
    profile = user.profile_for(organization)
    return unless profile

    ratings = LeaderboardRating.joins(:leaderboard)
                               .where(profile_id: profile.id, leaderboards: { organization_id: organization.id })

    # Delete all the ratings
    ratings.destroy_all

    # Note: We're not deleting match history to preserve historical data
    # If you want to delete match history too, uncomment the following:
    # Match.where("(profile1_id = ? OR opponent_profile_id = ?) AND leaderboard_id IN (?)",
    #             profile.id, profile.id, organization.leaderboard_ids).destroy_all
  end

  def membership_for_user(user_id, conditions = {})
    return nil if user_id.blank?

    scope = @organization.organization_memberships.joins(:profile)
                                .where(profiles: { user_id: user_id })
    scope = scope.where(conditions) if conditions.present?
    scope.first
  end

  def ensure_owner_membership(organization, user)
    ActiveRecord::Base.transaction do
      profile = user.profiles.find_or_initialize_by(organization: organization)
      profile.username ||= user.username
      profile.first_name ||= user.first_name
      profile.last_name ||= user.last_name
      profile.save!

      membership = organization.organization_memberships.find_or_initialize_by(profile: profile)
      membership.status = :approved
      membership.admin = true
      membership.save!
    end

    true
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotSaved => e
    organization.destroy if organization.persisted?
    error_message = e.respond_to?(:record) && e.record ? e.record.errors.full_messages.to_sentence : e.message
    organization.errors.add(:base, "Unable to add #{user.username} to the organization: #{error_message}")
    false
  end
end
