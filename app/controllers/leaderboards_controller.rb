# app/controllers/leaderboards_controller.rb

class LeaderboardsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization
  before_action :set_leaderboard, only: [:show, :edit, :update, :destroy, :rankings]
  before_action :authorize_admin!, only: [:new, :create, :edit, :update, :destroy]

  # GET /organizations/:organization_id/leaderboards
  # Lists all leaderboards in the given organization
  def index
    @leaderboards = @organization.leaderboards.order(:name)
  end

  # GET /organizations/:organization_id/leaderboards/:id
  # Shows a single leaderboard
  def show
    @rankings = @leaderboard.leaderboard_ratings.includes(profile: :user).order(rating: :desc)
  end

  # GET /organizations/:organization_id/leaderboards/new
  # Form to create a new leaderboard
  def new
    @leaderboard = @organization.leaderboards.build
  end

  # POST /organizations/:organization_id/leaderboards
  # Creates a new leaderboard within an organization
  def create
    @leaderboard = @organization.leaderboards.build(leaderboard_params)

    if @leaderboard.save
      flash[:notice] = "Leaderboard successfully created."
      redirect_to organization_leaderboard_path(@organization, @leaderboard)
    else
      flash.now[:alert] = @leaderboard.errors.full_messages.to_sentence
      render :new, status: :unprocessable_entity
    end
  end

  # GET /organizations/:organization_id/leaderboards/:id/edit
  # Form to edit an existing leaderboard
  def edit
  end

  # PATCH/PUT /organizations/:organization_id/leaderboards/:id
  # Updates an existing leaderboard's details
  def update
    if @leaderboard.update(leaderboard_params)
      flash[:notice] = "Leaderboard successfully updated."
      redirect_to organization_leaderboard_path(@organization, @leaderboard)
    else
      flash.now[:alert] = @leaderboard.errors.full_messages.to_sentence
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /organizations/:organization_id/leaderboards/:id
  # Removes a leaderboard from the organization
  def destroy
    if @leaderboard.destroy
      flash[:notice] = "Leaderboard successfully deleted."
      redirect_to organization_leaderboards_path(@organization)
    else
      flash[:alert] = "Failed to delete leaderboard."
      redirect_to organization_leaderboard_path(@organization, @leaderboard)
    end
  end

  # GET /organizations/:organization_id/leaderboards/:id/rankings
  # Renders either a partial (for Turbo Frame requests) or the full layout (normal request)
  def rankings
    @leaderboard = Leaderboard.find(params[:id])
    @organization = @leaderboard.organization
    @rankings = @leaderboard.leaderboard_ratings.includes(profile: :user).order(rating: :desc)

    respond_to do |format|
      format.html do
        if turbo_frame_request?
          render partial: "leaderboards/rankings",
                 locals: {
                   leaderboard: @leaderboard,
                   organization: @organization,
                   rankings: @rankings
                 },
                 layout: false
        else
          # For non-frame requests, do not render anything.
          # You can raise 404 or redirect instead.
          head :not_found
        end
      end
    end
  end

  private

  # Finds the organization based on :organization_id in the URL
  def set_organization
    @organization = Organization.find(params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end

  # Locates the specific leaderboard within the organization
  def set_leaderboard
    @leaderboard = @organization.leaderboards.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Leaderboard not found."
    redirect_to organization_leaderboards_path(@organization)
  end

  # Only org admins should be able to create/edit/update/destroy leaderboards
  def authorize_admin!
    unless @organization.admin?(current_user)
      flash[:alert] = "You are not authorized to modify this leaderboard."
      redirect_to organization_path(@organization)
    end
  end

  # Strong params for creating/updating leaderboards
  def leaderboard_params
    params.require(:leaderboard).permit(:name, :description, :sport)
  end
end
