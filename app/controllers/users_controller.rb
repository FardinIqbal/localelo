class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [:show, :edit, :update, :destroy]
  before_action :authorize_user!, only: [:edit, :update, :destroy]

  # GET /users/:id
  def show
    @matches = @user.matches.includes(:user1, :opponent, :leaderboard).recent.limit(5)
    @stats = UserStatsService.new(@user).calculate
  end

  # GET /users/:id/edit
  def edit
  end

  # PATCH/PUT /users/:id
  def update
    respond_to do |format|
      if @user.update(user_params)
        format.html { redirect_to user_path(@user), notice: "Profile updated successfully." }
        format.json { render :show, status: :ok, location: @user }
      else
        format.html do
          flash.now[:alert] = "There was an error updating your profile."
          render :edit, status: :unprocessable_entity
        end
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /users/:id
  def destroy
    @user.destroy
    respond_to do |format|
      format.html { redirect_to root_path, notice: "Your account has been deleted." }
      format.json { head :no_content }
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "User not found."
    redirect_to root_path
  end

  def authorize_user!
    unless current_user == @user
      flash[:alert] = "You are not authorized to perform this action."
      redirect_to root_path
    end
  end

  def user_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :username,
      :password,
      :password_confirmation,
      :current_password
    )
  end
end
