class SportTypesController < ApplicationController
  # Ensure only authenticated users can access these actions
  before_action :authenticate_user!

  # Load the sport type for show, edit, update, and destroy actions
  before_action :set_sport_type, only: [:show, :edit, :update, :destroy]

  # Ensure only admins can modify sport types
  before_action :authorize_admin!, only: [:new, :create, :edit, :update, :destroy]

  # GET /sport_types
  # Displays a list of all available sport types (BJJ, Chess, etc.)
  def index
    @sport_types = SportType.all.order(:name)
  end

  # GET /sport_types/:id
  # Shows details of a specific sport type, including metadata fields
  def show
  end

  # GET /sport_types/new
  # Displays the form to create a new sport type (admin only)
  def new
    @sport_type = SportType.new
  end

  # POST /sport_types
  # Handles the creation of a new sport type
  def create
    @sport_type = SportType.new(sport_type_params)

    if @sport_type.save
      flash[:notice] = "Sport type successfully created."
      redirect_to @sport_type
    else
      flash.now[:alert] = @sport_type.errors.full_messages.to_sentence
      render :new, status: :unprocessable_entity
    end
  end

  # GET /sport_types/:id/edit
  # Displays the form to edit an existing sport type (admin only)
  def edit
  end

  # PATCH/PUT /sport_types/:id
  # Updates an existing sport type
  def update
    if @sport_type.update(sport_type_params)
      flash[:notice] = "Sport type successfully updated."
      redirect_to @sport_type
    else
      flash.now[:alert] = @sport_type.errors.full_messages.to_sentence
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /sport_types/:id
  # Deletes a sport type (admin only)
  def destroy
    if @sport_type.destroy
      flash[:notice] = "Sport type deleted successfully."
      redirect_to sport_types_path
    else
      flash[:alert] = "Failed to delete sport type."
      redirect_to @sport_type
    end
  end

  private

  # Strong parameters: allow only permitted fields
  def sport_type_params
    params.require(:sport_type).permit(:name, metadata_template: {})
  end

  # Finds the sport type by ID before actions that require it
  def set_sport_type
    @sport_type = SportType.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Sport type not found."
    redirect_to sport_types_path
  end

  # Ensures only admins can create, update, or delete sport types
  def authorize_admin!
    unless current_user.admin?
      flash[:alert] = "You are not authorized to perform this action."
      redirect_to sport_types_path
    end
  end
end
