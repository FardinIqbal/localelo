class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: :destroy

  def destroy
    @user.discard

    if current_user == @user
      sign_out @user
      redirect_to unauthenticated_root_path, notice: "Your account has been successfully deleted."
    else
      redirect_back fallback_location: authenticated_root_path,
                    notice: "User has been successfully deleted."
    end
  end

  private

  def set_user
    @user = params[:id].present? ? User.find(params[:id]) : current_user
  end
end
