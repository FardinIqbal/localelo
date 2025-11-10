class DashboardController < ApplicationController
  before_action :authenticate_user!

  # GET /dashboard
  # This is the core dashboard for each logged-in user. It shows match history,
  # performance summaries, gym affiliations, rankings, and more — all personalized.
  def show
    @user = current_user
    @profiles = current_user.profiles
                             .includes(organization: :leaderboards,
                                       leaderboard_ratings: :leaderboard)
                             .order(created_at: :desc)
    @profile = if params[:profile_id].present?
                 @profiles.find { |profile| profile.id == params[:profile_id].to_i }
               end
    @profile ||= @profiles.first

    if params[:organization_id].present? && params[:organization_id] != "all"
      @scoped_organization = current_user.organizations.find_by(id: params[:organization_id])

      unless @scoped_organization
        redirect_to dashboard_path(organization_id: "all"), alert: "Organization not found." and return
      end
    else
      @scoped_organization = nil
    end

    profile_ids = @profile ? [@profile.id] : @user.profile_ids
    @profile_ids = profile_ids

    organization_ids = if @profile
                         [@profile.organization_id]
                       else
                         @profiles.pluck(:organization_id)
                       end

    # == Organizations and Leaderboards ==
    @organizations = current_user.organizations
                                 .includes(leaderboards: :leaderboard_ratings)
                                 .order(created_at: :desc)
    @selectable_organizations = current_user.organizations.order(:name)

    # == Match History (Recent Activity Partial) ==
    @recent_matches_all = if organization_ids.any?
                             Match
                               .joins(:leaderboard)
                               .where(leaderboards: { organization_id: organization_ids })
                               .includes(profile1: :user, opponent_profile: :user, leaderboard: :organization)
                               .order(match_time: :desc)
                               .limit(5)
                           else
                             Match.none
                           end

    @recent_matches_mine = if profile_ids.any?
                              Match.involving_profiles(profile_ids)
                                   .includes(profile1: :user, opponent_profile: :user, leaderboard: :organization)
                                   .order(match_time: :desc)
                                   .limit(5)
                            else
                              Match.none
                            end

    # == Elo History for Visualization (used by Stimulus or Turbo frame refreshes) ==
    @time_period = params[:period] || '30'
    period_days = @time_period == 'all' ? 365 : @time_period.to_i

    @elo_history = if profile_ids.any?
                     EloHistory.where(profile_id: profile_ids)
                               .where("recorded_at >= ?", period_days.days.ago)
                               .order(:recorded_at)
                               .pluck(:recorded_at, :elo)
                   else
                     []
                   end

    # == Rankings Across All Leaderboards ==
    @user_rankings = LeaderboardRating.joins(:profile)
                                      .where(profiles: { id: profile_ids.presence || @user.profile_ids })
                                      .includes(leaderboard: :organization)
                                      .order(rating: :desc)

    # == Basic Elo Stats ==
    ratings = user_leaderboard_ratings(@profile)
    elo_ratings = ratings.map(&:rating)
    @highest_elo = elo_ratings.max || 1500
    @average_elo = elo_ratings.any? ? (elo_ratings.sum / elo_ratings.size).round : 1500

    # == Win/Loss Summary ==
    @total_wins = ratings.sum(&:wins)
    @total_losses = ratings.sum(&:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")
    @profile_stats = {
      total_matches: @total_wins + @total_losses,
      total_wins: @total_wins,
      total_losses: @total_losses,
      win_loss_ratio: @win_loss_ratio,
      highest_elo: @highest_elo,
      average_elo: @average_elo
    }

    # == Match Activity Trend (30d vs previous 30d) ==
    current_period_matches = if profile_ids.any?
                               Match.involving_profiles(profile_ids)
                                    .where("match_time >= ?", 30.days.ago)
                                    .count
                             else
                               0
                             end
    previous_period_matches = if profile_ids.any?
                                Match.involving_profiles(profile_ids)
                                     .where(match_time: 60.days.ago...30.days.ago)
                                     .count
                              else
                                0
                              end

    @match_trend = previous_period_matches > 0 ?
                     ((current_period_matches - previous_period_matches).to_f / previous_period_matches * 100).round :
                     (current_period_matches > 0 ? 100 : 0)

    # == Most Active Leaderboard ==
    @most_active_leaderboard = if profile_ids.any?
                                 Match.involving_profiles(profile_ids)
                                      .select("matches.leaderboard_id, COUNT(*) AS matches_count")
                                      .group(:leaderboard_id)
                                      .order(Arel.sql("matches_count DESC"))
                                      .limit(1)
                                      .first&.leaderboard
                               end

    @organization = @most_active_leaderboard&.organization

    # == Optional: Upcoming Matches ==
    @upcoming_matches = if profile_ids.any?
                          Match.involving_profiles(profile_ids)
                               .where("match_time > ?", Time.now)
                               .order(match_time: :asc)
                               .limit(3)
                        else
                          Match.none
                        end

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

    ratings = user_leaderboard_ratings(@profile)

    if ratings.sum(&:wins) + ratings.sum(&:losses) == 0
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
    profile = current_user.profiles.find_by(id: params[:profile_id])

    ratings = user_leaderboard_ratings(profile)
    elo_ratings = ratings.map(&:rating)
    @highest_elo = elo_ratings.max || 1500
    @average_elo = elo_ratings.any? ? (elo_ratings.sum / elo_ratings.size).round : 1500

    @total_wins = ratings.sum(&:wins)
    @total_losses = ratings.sum(&:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")

    render partial: "dashboard/performance_stats", layout: false
  end

  def user_leaderboard_ratings(profile = nil)
    return profile.leaderboard_ratings.includes(:leaderboard) if profile

    @user_leaderboard_ratings ||= current_user.profiles
                                            .includes(leaderboard_ratings: :leaderboard)
                                            .flat_map(&:leaderboard_ratings)
  end

end
