class ProfilesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_profile, only: [:show, :edit, :update, :destroy]
  before_action :authorize_profile!, only: [:edit, :update, :destroy]

  def show
    @user = @profile.user
    @organization = @profile.organization
    @leaderboard_ratings = @profile.leaderboard_ratings.includes(leaderboard: :organization)
    @matches = Match.involving_profile(@profile.id)
                     .includes(match_participants: { profile: :user }, leaderboard: :organization)
                     .order(match_time: :desc)
                     .limit(5)
    @rating_history = RatingHistory.where(profile_id: @profile.id)
                                  .order(:created_at)
                                  .pluck(:created_at, :rating)

    total_matches = Match.involving_profile(@profile.id).count
    total_wins = Match.won_by_profile(@profile.id).count
    total_losses = total_matches - total_wins
    win_rate = total_matches.positive? ? (total_wins.to_f / total_matches * 100).round : 0

    @profile_stats = {
      total_matches: total_matches,
      total_wins: total_wins,
      total_losses: total_losses,
      win_rate: win_rate
    }
  end

  def edit; end

  def update
    if @profile.update(profile_params)
      redirect_to profile_path(@profile), notice: "Profile updated successfully."
    else
      flash.now[:alert] = "There was an error updating your profile."
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @profile.destroy
    redirect_to authenticated_root_path, notice: "Profile removed."
  end

  private

  def set_profile
    @profile = Profile.includes(:user, :organization).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    flash[:alert] = "Profile not found."
    redirect_to authenticated_root_path
  end

  def authorize_profile!
    return if @profile.user == current_user

    flash[:alert] = "You are not authorized to perform this action."
    redirect_to authenticated_root_path
  end

  def profile_params
    params.require(:profile).permit(:username, :first_name, :last_name, :avatar)
  end
end
