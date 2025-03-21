class DashboardController < ApplicationController
  before_action :authenticate_user!

  # GET /dashboard
  # Displays the user's dashboard with organizations, rankings, and match history
  def show
    @user = current_user

    # Fetch all organizations the user belongs to, eager loading leaderboards & ratings
    @organizations = current_user.organizations.includes(leaderboards: :leaderboard_ratings)
                                 .order(created_at: :desc)

    # Fetch recent matches where the user participated
    @recent_matches = Match.where("user1_id = ? OR opponent_id = ?", @user.id, @user.id)
                           .includes(:leaderboard, :user1, :opponent)
                           .order(created_at: :desc)
                           .limit(10)

    # Fetch Elo history for chart (configurable time period)
    @time_period = params[:period] || '30'
    period_days = @time_period == 'all' ? 365 : @time_period.to_i

    @elo_history = EloHistory.where(user_id: @user.id)
                             .where("created_at >= ?", period_days.days.ago)
                             .order(:created_at)
                             .pluck(:created_at, :elo)

    # Fetch leaderboard rankings for the user
    @user_rankings = LeaderboardRating.where(user: @user)
                                      .includes(leaderboard: :organization)
                                      .order(rating: :desc)

    # Calculate overall Elo stats
    elo_ratings = @user.leaderboard_ratings.pluck(:rating)
    @highest_elo = elo_ratings.max || 1500
    @average_elo = elo_ratings.any? ? (elo_ratings.sum / elo_ratings.size).round : 1500

    # Calculate win/loss stats
    @total_wins = @user.leaderboard_ratings.sum(:wins)
    @total_losses = @user.leaderboard_ratings.sum(:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")

    # Calculate match activity trend (% change in matches played over last 30 days vs previous 30 days)
    current_period_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND created_at >= ?",
                                         @user.id, @user.id, 30.days.ago).count
    previous_period_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND created_at >= ? AND created_at < ?",
                                          @user.id, @user.id, 60.days.ago, 30.days.ago).count

    @match_trend = previous_period_matches > 0 ?
                     ((current_period_matches - previous_period_matches).to_f / previous_period_matches * 100).round :
                     (current_period_matches > 0 ? 100 : 0)

    # Determine most active leaderboard (highest match count)
    @most_active_leaderboard = Leaderboard.joins(:matches)
                                          .where(matches: { user1_id: @user.id })
                                          .or(Leaderboard.joins(:matches).where(matches: { opponent_id: @user.id }))
                                          .group("leaderboards.id")
                                          .order(Arel.sql("COUNT(matches.id) DESC"))
                                          .limit(1)
                                          .first

    # Ensure @organization is assigned
    @organization = @most_active_leaderboard&.organization

    # Get upcoming matches if you have a scheduling feature
    @upcoming_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND match_time > ?",
                                    @user.id, @user.id, Time.now)
                             .order(match_time: :asc)
                             .limit(3)

    # Get personalized tips based on user activity
    @tips = generate_personalized_tips

    # Get top players across all leaderboards for inspiration
    @top_players = User.joins(:leaderboard_ratings)
                       .select("users.*, MAX(leaderboard_ratings.rating) as highest_rating")
                       .group("users.id")
                       .order("highest_rating DESC")
                       .limit(5)
  end

  private

  def generate_personalized_tips
    tips = []

    # New user tip
    if @user.leaderboard_ratings.sum(:wins) + @user.leaderboard_ratings.sum(:losses) == 0
      tips << "Log your first match to start building your Elo rating and track your progress."
    end

    # Inactive user tip
    if Match.where("(user1_id = ? OR opponent_id = ?) AND created_at >= ?", @user.id, @user.id, 30.days.ago).count == 0
      tips << "You haven't played any matches in the last 30 days. Stay active to maintain your skills!"
    end

    # Improvement tip
    if @elo_history.size >= 2 && @elo_history.last[1] > @elo_history.first[1]
      elo_gain = @elo_history.last[1] - @elo_history.first[1]
      tips << "Great job! You've improved your Elo by #{elo_gain} points in the selected time period."
    end

    # Join more gyms tip
    if @organizations.count < 2
      tips << "Join more gyms to expand your network and find new opponents."
    end

    # Verification tip
    unverified_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND verified = false", @user.id, @user.id).count
    if unverified_matches > 0
      tips << "You have #{unverified_matches} unverified matches. Verify them to ensure accurate rankings."
    end

    # Return random tip if none generated
    tips.sample || "Play consistently to improve your Elo rating. Your highest rating is currently #{@highest_elo}."
  end
end
