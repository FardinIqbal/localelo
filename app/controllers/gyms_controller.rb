class GymsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_gym, only: [:show, :members]

  # List all gyms the user is a member of
  def index
    @gyms = Gym.joins(:gym_memberships)
               .where(gym_memberships: { user_id: current_user.id })
               .distinct
  end

  # Show a single gym with members ranked by Elo
  def show
    @users = @gym.users
                 .joins(:gym_memberships)
                 .where(gym_memberships: { gym_id: @gym.id })
                 .select("users.*, gym_memberships.elo AS gym_elo")
                 .order("gym_memberships.elo DESC") # Rank members by Elo

    @matches = @gym.matches.includes(:user1, :opponent).order(match_time: :desc)
  end

  # Form to create a new gym
  def new
    @gym = Gym.new
  end

  # Create a new gym & auto-add creator as a member
  def create
    @gym = Gym.new(gym_params)

    if @gym.save
      GymMembership.create!(user: current_user, gym: @gym, elo: 1500) # Auto-add creator with starting Elo
      redirect_to @gym, notice: "Gym successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  # Fetch gym members excluding the current user (JSON response for frontend use)
  def members
    members = @gym.users
                  .where.not(id: current_user.id)
                  .joins(:gym_memberships)
                  .select("users.id, users.first_name, users.last_name, gym_memberships.elo AS gym_elo")
                  .order("gym_memberships.elo DESC") # Rank members dynamically

    render json: members
  end

  private

  # Set gym before specific actions
  def set_gym
    @gym = Gym.find_by(id: params[:id])

    unless @gym
      Rails.logger.warn "Gym not found with ID: #{params[:id]}"
      redirect_to gyms_path, alert: "Gym not found."
    end
  end

  # Strong parameters to prevent mass-assignment vulnerabilities
  def gym_params
    params.require(:gym).permit(:name, :subdomain)
  end
end
