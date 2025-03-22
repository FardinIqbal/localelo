class DashboardController < ApplicationController
  before_action :authenticate_user!

  # GET /dashboard
  # This is the core dashboard for each logged-in user. It shows match history,
  # performance summaries, gym affiliations, rankings, and more — all personalized.
  def show
    @user = current_user

    # == Organizations and Leaderboards ==
    @organizations = current_user.organizations
                                 .includes(leaderboards: :leaderboard_ratings)
                                 .order(created_at: :desc)

    # == Match History (Recent Activity Partial) ==
    @recent_matches_all = Match
                            .joins(:leaderboard)
                            .where(leaderboards: { organization_id: current_user.organization_ids })
                            .includes(:user1, :opponent, leaderboard: :organization)
                            .order(match_time: :desc)
                            .limit(20)

    @recent_matches_mine = Match
                             .where("user1_id = :id OR opponent_id = :id", id: current_user.id)
                             .includes(:user1, :opponent, leaderboard: :organization)
                             .order(match_time: :desc)
                             .limit(20)

    @pending_matches = Match.where("(user1_id = :id OR opponent_id = :id) AND verified = false", id: current_user.id)
                            .order(created_at: :desc)
                            .limit(10)

    # == Elo History for Visualization (used by Stimulus or Turbo frame refreshes) ==
    @time_period = params[:period] || '30'
    period_days = @time_period == 'all' ? 365 : @time_period.to_i

    @elo_history = EloHistory.where(user_id: @user.id)
                             .where("recorded_at >= ?", period_days.days.ago)
                             .order(:recorded_at)
                             .pluck(:recorded_at, :elo)

    # == Rankings Across All Leaderboards ==
    @user_rankings = LeaderboardRating.where(user: @user)
                                      .includes(leaderboard: :organization)
                                      .order(rating: :desc)

    # == Basic Elo Stats ==
    elo_ratings = @user.leaderboard_ratings.pluck(:rating)
    @highest_elo = elo_ratings.max || 1500
    @average_elo = elo_ratings.any? ? (elo_ratings.sum / elo_ratings.size).round : 1500

    # == Win/Loss Summary ==
    @total_wins = @user.leaderboard_ratings.sum(:wins)
    @total_losses = @user.leaderboard_ratings.sum(:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")

    # == Match Activity Trend (30d vs previous 30d) ==
    current_period_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND match_time >= ?", @user.id, @user.id, 30.days.ago).count
    previous_period_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND match_time >= ? AND match_time < ?", @user.id, @user.id, 60.days.ago, 30.days.ago).count

    @match_trend = previous_period_matches > 0 ?
                     ((current_period_matches - previous_period_matches).to_f / previous_period_matches * 100).round :
                     (current_period_matches > 0 ? 100 : 0)

    # == Most Active Leaderboard ==
    @most_active_leaderboard = Leaderboard.joins(:matches)
                                          .where(matches: { user1_id: @user.id })
                                          .or(Leaderboard.joins(:matches).where(matches: { opponent_id: @user.id }))
                                          .group("leaderboards.id")
                                          .order(Arel.sql("COUNT(matches.id) DESC"))
                                          .limit(1)
                                          .first

    @organization = @most_active_leaderboard&.organization

    # == Optional: Upcoming Matches ==
    @upcoming_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND match_time > ?", @user.id, @user.id, Time.now)
                             .order(match_time: :asc)
                             .limit(3)

    # == Tips and Guidance ==
    @tips = generate_personalized_tips

    # == Optional: Top 5 Users Globally ==
    @top_players = User.joins(:leaderboard_ratings)
                       .select("users.*, MAX(leaderboard_ratings.rating) as highest_rating")
                       .group("users.id")
                       .order("highest_rating DESC")
                       .limit(5)

    respond_to do |format|
      format.html
      format.json { render json: { elo_history: @elo_history } }
    end
  end

  private

  def generate_personalized_tips
    tips = []

    if @user.leaderboard_ratings.sum(:wins) + @user.leaderboard_ratings.sum(:losses) == 0
      tips << "Log your first match to start building your Elo rating and track your progress."
    end

    if Match.where("(user1_id = ? OR opponent_id = ?) AND match_time >= ?", @user.id, @user.id, 30.days.ago).count == 0
      tips << "You haven't played any matches in the last 30 days. Stay active to maintain your skills!"
    end

    if @elo_history.size >= 2 && @elo_history.last[1] > @elo_history.first[1]
      elo_gain = @elo_history.last[1] - @elo_history.first[1]
      tips << "Great job! You've improved your Elo by #{elo_gain} points in the selected time period."
    end

    if @organizations.count < 2
      tips << "Join more gyms to expand your network and find new opponents."
    end

    unverified_matches = Match.where("(user1_id = ? OR opponent_id = ?) AND verified = false", @user.id, @user.id).count
    if unverified_matches > 0
      tips << "You have #{unverified_matches} unverified matches. Verify them to ensure accurate rankings."
    end

    tips.sample || "Play consistently to improve your Elo rating. Your highest rating is currently #{@highest_elo}."
  end

  def performance
    @user = current_user

    elo_ratings = @user.leaderboard_ratings.pluck(:rating)
    @highest_elo = elo_ratings.max || 1500
    @average_elo = elo_ratings.any? ? (elo_ratings.sum / elo_ratings.size).round : 1500

    @total_wins = @user.leaderboard_ratings.sum(:wins)
    @total_losses = @user.leaderboard_ratings.sum(:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")

    render partial: "dashboard/performance_stats", layout: false
  end

  def matches_to_verify
    @pending_matches = Match.where(opponent_id: current_user.id, verified: false)

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "verify_matches",
          partial: "dashboard/match_verifications",
          locals: { matches: @pending_matches }
        )
      end
    end
  end
end
