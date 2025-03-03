class GymsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_gym, only: [:show]

  # List all gyms the user is a member of
  def index
    @gyms = Gym.joins(:gym_memberships).where(gym_memberships: { user_id: current_user.id }).distinct
  end

  # Show a single gym with members ranked by Elo
  def show
    @users = @gym.users.joins(:gym_memberships)
                 .where(gym_memberships: { gym_id: @gym.id })
                 .order("gym_memberships.elo DESC")

    @matches = Match.includes(:user1, :user2)
                    .where(gym: @gym)
                    .order(created_at: :desc)
  end

  # Form to create a new gym
  def new
    @gym = Gym.new
  end

  # Create a new gym & auto-add creator as a member
  def create
    @gym = Gym.new(gym_params)
    if @gym.save
      GymMembership.create!(user: current_user, gym: @gym, elo: 1500) # Ensure user is auto-added
      redirect_to @gym, notice: "Gym successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  # New endpoint to fetch gym members
  def members
    gym = Gym.find(params[:id])
    members = gym.users.where.not(id: current_user.id)  # Exclude the current user
    render json: members.select(:id, :email)  # Send only necessary data
  end

  private

  def set_gym
    @gym = Gym.find(params[:id])
  end

  def gym_params
    params.require(:gym).permit(:name, :subdomain)
  end
end
