class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [:show]

  def show
    Rails.logger.debug "Params received: #{params.inspect}" # Debugging

    @gym_memberships = @user.gym_memberships.includes(:gym) # Load all gyms for user
    @matches = @user.all_matches.order(match_time: :desc).limit(5) # Last 5 matches

    # Elo and performance stats per gym
    @gym_stats = @gym_memberships.map do |membership|
      total_matches = membership.match_history.count
      wins = membership.win_count
      losses = total_matches - wins
      win_rate = total_matches.positive? ? ((wins.to_f / total_matches) * 100).round : 0
      rival = most_faced_opponent_in_gym(membership.gym)

      {
        gym: membership.gym,
        elo: membership.elo,
        rank: membership.rank,
        total_matches: total_matches,
        wins: wins,
        losses: losses,
        win_rate: win_rate,
        join_date: membership.created_at.strftime("%B %d, %Y"),
        most_faced_opponent: rival[:opponent],
        matches_against_rival: rival[:matches_played]
      }
    end

    # Global stats
    @total_matches = @user.all_matches.count
    @win_count = @user.win_count
    @loss_count = @user.loss_count
    @win_rate = @user.win_rate
    @elo_current = @user.gym_memberships.maximum(:elo) || 1500
    @elo_start = 1500
    @elo_highest = @user.highest_elo
    @elo_gain_last_30_days = @user.elo_gain_last_30_days

    # Match analytics
    @most_used_submission = most_used_submission
    @top_rival = top_rival
  end

  private

  def set_user
    @user = params[:id] ? User.find_by(id: params[:id]) : current_user

    unless @user
      Rails.logger.warn "User not found with ID: #{params[:id]}"
      redirect_to root_path, alert: "User not found."
    end
  end

  # Finds the most frequently used submission
  def most_used_submission
    @user.all_matches.where.not(submission: nil)
         .group(:submission)
         .order("COUNT(submission) DESC")
         .limit(1)
         .pluck(:submission)
         .first || "None"
  end

  # Finds the most frequently faced opponent across all gyms
  def top_rival
    opponent_stats = @user.all_matches
                          .group(Arel.sql("CASE WHEN user1_id = #{ActiveRecord::Base.connection.quote(@user.id)} THEN opponent_id ELSE user1_id END"))
                          .order(Arel.sql("COUNT(*) DESC"))
                          .limit(1)
                          .pluck(Arel.sql("CASE WHEN user1_id = #{ActiveRecord::Base.connection.quote(@user.id)} THEN opponent_id ELSE user1_id END, COUNT(*)"))
                          .first


    return { opponent: "None", matches_played: 0 } unless opponent_stats

    opponent_id, matches_played = opponent_stats
    opponent = User.find_by(id: opponent_id)

    { opponent: opponent&.full_name || "Unknown", matches_played: matches_played }
  end

  # Finds the most frequently faced opponent in a given gym
  def most_faced_opponent_in_gym(gym)
    opponent_stats = @user.all_matches
                          .group(Arel.sql("CASE WHEN user1_id = #{ActiveRecord::Base.connection.quote(@user.id)} THEN opponent_id ELSE user1_id END"))
                          .order(Arel.sql("COUNT(*) DESC"))
                          .limit(1)
                          .pluck(Arel.sql("CASE WHEN user1_id = #{ActiveRecord::Base.connection.quote(@user.id)} THEN opponent_id ELSE user1_id END, COUNT(*)"))
                          .first




    return { opponent: "None", matches_played: 0 } unless opponent_stats

    opponent_id, matches_played = opponent_stats
    opponent = User.find_by(id: opponent_id)

    { opponent: opponent&.full_name || "Unknown", matches_played: matches_played }
  end
end
