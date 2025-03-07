class UsersController < ApplicationController
  before_action :authenticate_user!, only: [:show, :edit, :update]

  # Show user profile
  def show
    @user = current_user
    # This can include additional logic for showing user's match history, stats, etc.
  end

  # Edit user profile (for instance, updating username, password, etc.)
  def edit
    @user = current_user
  end

  # Update user profile
  def update
    @user = current_user

    # If the user has submitted the form with valid data, save changes
    if @user.update(user_params)
      flash[:notice] = "Your profile has been updated successfully."
      redirect_to user_path(@user)
    else
      flash.now[:alert] = "There was an error updating your profile."
      render :edit
    end
  end

  # Destroy account (log out and delete user)
  def destroy
    # Optionally add a confirmation message here
    current_user.destroy
    flash[:notice] = "Your account has been deleted successfully."
    redirect_to root_path
  end

  private

  # Strong parameters for user input (including username if that's required)
  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :password, :password_confirmation, :current_password, :username)
  end
end
