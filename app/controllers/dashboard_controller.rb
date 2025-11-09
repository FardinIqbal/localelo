class DashboardController < ApplicationController
  before_action :authenticate_user!

  # GET /dashboard
  # This is the core dashboard for each logged-in user. It shows match history,
  # performance summaries, gym affiliations, rankings, and more — all personalized.
  def show
    @user = current_user
    profile_ids = @user.profile_ids
    @profile_ids = profile_ids

    # == Organizations and Leaderboards ==
    @organizations = current_user.organizations
                                 .includes(leaderboards: :leaderboard_ratings)
                                 .order(created_at: :desc)

    # == Match History (Recent Activity Partial) ==
    org_ids = current_user.profiles.select(:organization_id)
    @recent_matches_all = Match
                            .joins(:leaderboard)
                            .where(leaderboards: { organization_id: org_ids })
                            .includes(profile1: :user, opponent_profile: :user, leaderboard: :organization)
                            .order(match_time: :desc)
                            .limit(5)

    @recent_matches_mine = current_user.matches
                                          .includes(profile1: :user, opponent_profile: :user, leaderboard: :organization)
                                          .order(match_time: :desc)
                                          .limit(5)

    # == Elo History for Visualization (used by Stimulus or Turbo frame refreshes) ==
    @time_period = params[:period] || '30'
    period_days = @time_period == 'all' ? 365 : @time_period.to_i

    @elo_history = EloHistory.where(profile_id: profile_ids)
                             .where("recorded_at >= ?", period_days.days.ago)
                             .order(:recorded_at)
                             .pluck(:recorded_at, :elo)

    # == Rankings Across All Leaderboards ==
    @user_rankings = LeaderboardRating.joins(:profile)
                                      .where(profiles: { user_id: @user.id })
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
    current_period_matches = Match.involving_profiles(profile_ids)
                                  .where("match_time >= ?", 30.days.ago)
                                  .count
    previous_period_matches = Match.involving_profiles(profile_ids)
                                    .where(match_time: 60.days.ago...30.days.ago)
                                    .count

    @match_trend = previous_period_matches > 0 ?
                     ((current_period_matches - previous_period_matches).to_f / previous_period_matches * 100).round :
                     (current_period_matches > 0 ? 100 : 0)

    # == Most Active Leaderboard ==
    @most_active_leaderboard = current_user.matches
                                        .group(:leaderboard_id)
                                        .order(Arel.sql("COUNT(*) DESC"))
                                        .limit(1)
                                        .map(&:leaderboard)
                                        .first

    @organization = @most_active_leaderboard&.organization

    # == Optional: Upcoming Matches ==
    @upcoming_matches = Match.involving_profiles(profile_ids)
                             .where("match_time > ?", Time.now)
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

    if Match.involving_profiles(@profile_ids).where("match_time >= ?", 30.days.ago).count == 0
      tips << "You haven't played any matches in the last 30 days. Stay active to maintain your skills!"
    end

    if @elo_history.size >= 2 && @elo_history.last[1] > @elo_history.first[1]
      elo_gain = @elo_history.last[1] - @elo_history.first[1]
      tips << "Great job! You've improved your Elo by #{elo_gain} points in the selected time period."
    end

    if @organizations.count < 2
      tips << "Join more gyms to expand your network and find new opponents."
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

end
