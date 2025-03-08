class LinkflairsController < ApplicationController
  # Ensure the user is authenticated before accessing any actions
  before_action :authenticate_user!

  # Set the organization or linkflair (if needed) before certain actions
  before_action :set_organization
  before_action :set_linkflair, only: [:show, :edit, :update, :destroy]

  # GET /organizations/:organization_id/linkflairs
  # This action will display all linkflairs associated with a specific organization
  def index
    # Fetch all linkflairs belonging to the organization
    @linkflairs = @organization.linkflairs
  end

  # GET /organizations/:organization_id/linkflairs/:id
  # This action shows the details of a specific linkflair
  def show
    # @linkflair is already set by the before_action :set_linkflair
  end

  # GET /organizations/:organization_id/linkflairs/new
  # This action renders a form for creating a new linkflair
  def new
    @linkflair = @organization.linkflairs.build  # Build a new linkflair associated with the organization
  end

  # POST /organizations/:organization_id/linkflairs
  # This action creates a new linkflair for the organization
  def create
    @linkflair = @organization.linkflairs.build(linkflair_params)

    # Attempt to save the new linkflair
    if @linkflair.save
      flash[:notice] = "Linkflair created successfully."
      redirect_to organization_linkflair_path(@organization, @linkflair)
    else
      flash.now[:alert] = "Failed to create linkflair. Please try again."
      render :new  # Re-render the 'new' form if creation fails
    end
  end

  # GET /organizations/:organization_id/linkflairs/:id/edit
  # This action renders the edit form for an existing linkflair
  def edit
    # @linkflair is already set by the before_action :set_linkflair
  end

  # PATCH/PUT /organizations/:organization_id/linkflairs/:id
  # This action updates an existing linkflair's attributes
  def update
    # Attempt to update the linkflair with the new parameters
    if @linkflair.update(linkflair_params)
      flash[:notice] = "Linkflair updated successfully."
      redirect_to organization_linkflair_path(@organization, @linkflair)
    else
      flash.now[:alert] = "Failed to update linkflair. Please try again."
      render :edit  # Re-render the 'edit' form if update fails
    end
  end

  # DELETE /organizations/:organization_id/linkflairs/:id
  # This action deletes the specified linkflair
  def destroy
    if @linkflair.destroy
      flash[:notice] = "Linkflair deleted successfully."
      redirect_to organization_linkflairs_path(@organization)
    else
      flash[:alert] = "Failed to delete linkflair."
      redirect_to organization_linkflair_path(@organization, @linkflair)
    end
  end

  private

  # Set the organization based on the organization_id in the URL
  def set_organization
    @organization = Organization.find(params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Organization not found."
    redirect_to organizations_path
  end

  # Set the linkflair based on the linkflair_id in the URL
  def set_linkflair
    @linkflair = @organization.linkflairs.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Linkflair not found."
    redirect_to organization_linkflairs_path(@organization)
  end

  # Strong parameters for creating or updating a linkflair
  def linkflair_params
    params.require(:linkflair).permit(:name, :description, :image_url)  # Permit necessary attributes
  end
end
