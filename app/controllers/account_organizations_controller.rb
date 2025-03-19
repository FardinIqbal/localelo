class AccountOrganizationsController < ApplicationController
  before_action :authenticate_user!

  def index
    @organizations = current_user.organizations
    # You can add pagination here if needed
    # @organizations = current_user.organizations.page(params[:page]).per(10)
  end

  # You might want to add other actions in the future such as:

  # def show
  #   @organization = current_user.organizations.find(params[:id])
  # end

  # def new
  #   @organization = Organization.new
  # end

  # def create
  #   @organization = current_user.organizations.build(organization_params)
  #   if @organization.save
  #     redirect_to account_organization_path(@organization), notice: 'Organization created successfully'
  #   else
  #     render :new
  #   end
  # end

  # private

  # def organization_params
  #   params.require(:organization).permit(:name, :description, :location)
  # end
end
