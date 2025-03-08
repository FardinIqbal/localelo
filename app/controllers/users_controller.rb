class UsersController < ApplicationController
  # Ensure the user is authenticated before accessing the profile show, edit, and update actions
  before_action :authenticate_user!, only: [:show, :edit, :update, :destroy]

  # Show user profile
  # This will show the user's personal information, and can be extended to show additional data like match history or stats.
  def show
    @user = current_user
    # Additional logic for showing match history, statistics, etc., can be added here if needed
  end

  # Edit user profile (for instance, updating username, password, etc.)
  def edit
    @user = current_user
    # The edit form will prepopulate with the current user's data
  end

  # Update user profile
  def update
    @user = current_user

    # Ensure the user provides a valid input for profile updates (e.g., password, email, etc.)
    if @user.update(user_params)
      flash[:notice] = "Your profile has been updated successfully."
      redirect_to user_path(@user)
    else
      flash.now[:alert] = "There was an error updating your profile. Please try again."
      render :edit # This will re-render the edit form with error messages
    end
  end

  # Destroy account (log out and delete the user)
  def destroy
    # Optionally, confirm the user's intention before destroying the account (could add a confirmation view)
    current_user.destroy
    flash[:notice] = "Your account has been deleted successfully."
    redirect_to root_path
  end

  private

  # Strong parameters for user input
  # We only permit the attributes that the user is allowed to update (password, email, etc.)
  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :password, :password_confirmation, :current_password, :username)
  end
end
