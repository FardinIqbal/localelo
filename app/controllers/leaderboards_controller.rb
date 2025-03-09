class LeaderboardsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_organization
  before_action :set_leaderboard, only: [:show, :edit, :update, :destroy]
  before_action :authorize_admin!, only: [:new, :create, :edit, :update, :destroy]

  # GET /organizations/:organization_id/leaderboards
  def index
    @leaderboards = @organization.leaderboards
  end

  # GET /organizations/:organization_id/leaderboards/:id
  def show
    @rankings = @leaderboard.leaderboard_ratings.includes(:user).order(rating: :desc)
  end

  # GET /organizations/:organization_id/leaderboards/new
  def new
    @leaderboard = @organization.leaderboards.build
  end

  # POST /organizations/:organization_id/leaderboards
  def create
    @leaderboard = @organization.leaderboards.build(leaderboard_params)

    if @leaderboard.save
      flash[:notice] = "Leaderboard successfully created."
      redirect_to organization_leaderboard_path(@organization.id, @leaderboard)
    else
      flash.now[:alert] = "There was an error creating the leaderboard."
      render :new, status: :unprocessable_entity
    end
  end

  # GET /organizations/:organization_id/leaderboards/:id/edit
  def edit
  end

  # PATCH /organizations/:organization_id/leaderboards/:id
  def update
    if @leaderboard.update(leaderboard_params)
      flash[:notice] = "Leaderboard successfully updated."
      redirect_to organization_leaderboard_path(@organization.id, @leaderboard)
    else
      flash.now[:alert] = "There was an error updating the leaderboard."
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /organizations/:organization_id/leaderboards/:id
  def destroy
    if @leaderboard.destroy
      flash[:notice] = "Leaderboard successfully deleted."
      redirect_to organization_leaderboards_path(@organization.id)
    else
      flash[:alert] = "Failed to delete leaderboard."
      redirect_to organization_leaderboard_path(@organization.id, @leaderboard)
    end
  end

  private

  def set_organization
    @organization = Organization.find(params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end

  def set_leaderboard
    @leaderboard = @organization.leaderboards.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Leaderboard not found."
    redirect_to organization_leaderboards_path(@organization.id)
  end

  def authorize_admin!
    unless @organization.admin?(current_user)
      flash[:alert] = "You are not authorized to modify this leaderboard."
      redirect_to organization_path(@organization.id)
    end
  end

  def leaderboard_params
    params.require(:leaderboard).permit(:name, :sport_type_id)
  end
end
