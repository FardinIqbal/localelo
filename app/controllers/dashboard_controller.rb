class DashboardController < ApplicationController
  before_action :authenticate_user!

  # GET /dashboard
  # This is the core dashboard for each logged-in user. It shows match history,
  # performance summaries, gym affiliations, rankings, and more — all personalized.
  def show
    @user = current_user

    if params[:organization_id].present? && params[:organization_id] != "all"
      @scoped_organization = current_user.organizations.find_by(id: params[:organization_id])

      unless @scoped_organization
        redirect_to dashboard_path(organization_id: "all"), alert: "Organization not found." and return
      end
    else
      @scoped_organization = nil
    end

    @profiles = current_user.profiles
                             .includes(organization: :leaderboards,
                                       leaderboard_ratings: :leaderboard)
                             .order(created_at: :desc)
    @profiles = @profiles.where(organization_id: @scoped_organization.id) if @scoped_organization

    @approved_profile_ids = current_user.profiles
                                        .joins(:organization_membership)
                                        .merge(OrganizationMembership.approved)
                                        .ids

    @profile = if params[:profile_id].present?
                 @profiles.find_by(id: params[:profile_id])
               end
    @profile ||= @profiles.first

    profile_ids = if @profile
                     [@profile.id]
                   else
                     @profiles.ids
                   end
    profile_ids = Array(profile_ids)
    @profile_ids = profile_ids

    organization_ids = if @scoped_organization
                         [@scoped_organization.id]
                       elsif @profile
                         [@profile.organization_id]
                       elsif @profiles.any?
                         @profiles.pluck(:organization_id)
                       else
                         []
                       end

    scoped_leaderboard_ids = Array(@scoped_organization&.leaderboard_ids)

    # == Organizations and Leaderboards ==
    @organizations = current_user.organizations
                                 .includes(leaderboards: :leaderboard_ratings)
                                 .order(created_at: :desc)
    @selectable_organizations = current_user.organizations.order(:name)

    # == Match History (Recent Activity Partial) ==
    @recent_matches_all = if @scoped_organization
                             Match
                               .joins(:leaderboard)
                               .where(leaderboards: { organization_id: @scoped_organization.id })
                               .includes(match_participants: { profile: :user }, leaderboard: :organization)
                               .order(match_time: :desc)
                               .limit(5)
                           elsif organization_ids.any?
                             Match
                               .joins(:leaderboard)
                               .where(leaderboards: { organization_id: organization_ids })
                               .includes(match_participants: { profile: :user }, leaderboard: :organization)
                               .order(match_time: :desc)
                               .limit(5)
                           else
                             Match.none
                           end

    @recent_matches_mine = if profile_ids.any?
                              scope = Match.involving_profiles(profile_ids)
                                           .includes(match_participants: { profile: :user }, leaderboard: :organization)
                                           .order(match_time: :desc)
                                           .limit(5)
                              scope = scope.where(leaderboard_id: scoped_leaderboard_ids) if @scoped_organization
                              scope
                            else
                              Match.none
                            end

    # == Rating History for Visualization (used by Stimulus or Turbo frame refreshes) ==
    @time_period = params[:period] || '30'
    period_days = @time_period == 'all' ? 365 : @time_period.to_i

    @rating_history = if profile_ids.any?
                        RatingHistory.where(profile_id: profile_ids)
                                     .where("created_at >= ?", period_days.days.ago)
                                     .order(:created_at)
                                     .pluck(:created_at, :rating)
                      else
                        []
                      end

    # == Rankings Across All Leaderboards ==
    ranking_profile_ids = if @scoped_organization
                            profile_ids
                          else
                            profile_ids.presence || @approved_profile_ids
                          end

    @user_rankings = LeaderboardRating.joins(:profile, :leaderboard)
                                      .where(profiles: { id: ranking_profile_ids })
    @user_rankings = @user_rankings.where(leaderboards: { organization_id: @scoped_organization.id }) if @scoped_organization
    @user_rankings = @user_rankings.includes(leaderboard: :organization)
                                     .order(rating: :desc)

    # == Basic Rating Stats ==
    ratings = user_leaderboard_ratings(@profile)
    rating_values = ratings.pluck(:rating)
    @highest_rating = rating_values.max || 1500
    @average_rating = rating_values.any? ? (rating_values.sum / rating_values.size).round : 1500

    # == Win/Loss Summary ==
    @total_wins = ratings.sum(:wins)
    @total_losses = ratings.sum(:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")
    @profile_stats = {
      total_matches: @total_wins + @total_losses,
      total_wins: @total_wins,
      total_losses: @total_losses,
      win_loss_ratio: @win_loss_ratio,
      highest_rating: @highest_rating,
      average_rating: @average_rating
    }

    # == Match Activity Trend (30d vs previous 30d) ==
    matches_scope = if profile_ids.any?
                      Match.involving_profiles(profile_ids)
                    else
                      Match.none
                    end
    matches_scope = matches_scope.where(leaderboard_id: scoped_leaderboard_ids) if @scoped_organization

    current_period_matches = matches_scope.where("match_time >= ?", 30.days.ago).count
    previous_period_matches = matches_scope.where(match_time: 60.days.ago...30.days.ago).count

    @match_trend = previous_period_matches > 0 ?
                     ((current_period_matches - previous_period_matches).to_f / previous_period_matches * 100).round :
                     (current_period_matches > 0 ? 100 : 0)

    # == Most Active Leaderboard ==
    @most_active_leaderboard = if profile_ids.any?
                                 scope = Match.involving_profiles(profile_ids)
                                 scope = scope.where(leaderboard_id: scoped_leaderboard_ids) if @scoped_organization
                                 scope
                                   .select("matches.leaderboard_id, COUNT(*) AS matches_count")
                                   .group(:leaderboard_id)
                                   .order(Arel.sql("matches_count DESC"))
                                   .limit(1)
                                   .first&.leaderboard
                               end

    @organization = @most_active_leaderboard&.organization

    # == Optional: Upcoming Matches ==
    @upcoming_matches = if profile_ids.any?
                          scope = Match.involving_profiles(profile_ids)
                          scope = scope.where(leaderboard_id: scoped_leaderboard_ids) if @scoped_organization
                          scope
                            .where("match_time > ?", Time.current)
                            .order(match_time: :asc)
                            .limit(3)
                        else
                          Match.none
                        end

    # == Tips and Guidance ==
    @tips = generate_personalized_tips

    # == Optional: Top 5 Users Globally ==
    @top_players = User.joins(leaderboard_ratings: :leaderboard)
                       .select("users.*, MAX(leaderboard_ratings.rating) as highest_rating")
    @top_players = @top_players.where(leaderboards: { organization_id: @scoped_organization.id }) if @scoped_organization
    @top_players = @top_players.group("users.id")
                               .order("highest_rating DESC")
                               .limit(5)

    respond_to do |format|
      format.html
      format.json { render json: { rating_history: @rating_history } }
    end
  end

  private

  def generate_personalized_tips
    tips = []

    ratings = user_leaderboard_ratings(@profile)

    if ratings.sum(:wins) + ratings.sum(:losses) == 0
      tips << "Log your first match to start building your rating and track your progress."
    end

    matches_scope = Match.involving_profiles(Array(@profile_ids))
    matches_scope = matches_scope.where(leaderboard_id: Array(@scoped_organization&.leaderboard_ids)) if @scoped_organization

    if matches_scope.where("matches.created_at >= ?", 30.days.ago).count == 0
      tips << "You haven't played any matches in the last 30 days. Stay active to maintain your skills!"
    end

    if @rating_history.size >= 2 && @rating_history.last[1] > @rating_history.first[1]
      rating_gain = @rating_history.last[1] - @rating_history.first[1]
      tips << "Great job! You've improved your rating by #{rating_gain.round} points in the selected time period."
    end

    if @organizations.count < 2
      tips << "Join more gyms to expand your network and find new opponents."
    end

    tips.sample || "Play consistently to improve your rating. Your highest rating is currently #{@highest_rating.round}."
  end

  def performance
    @user = current_user
    profile = current_user.profiles.find_by(id: params[:profile_id])

    ratings = user_leaderboard_ratings(profile)
    rating_values = ratings.pluck(:rating)
    @highest_rating = rating_values.max || 1500
    @average_rating = rating_values.any? ? (rating_values.sum / rating_values.size).round : 1500

    @total_wins = ratings.sum(:wins)
    @total_losses = ratings.sum(:losses)
    @win_loss_ratio = @total_losses > 0 ? (@total_wins.to_f / @total_losses).round(2) : (@total_wins > 0 ? "∞" : "0.0")

    render partial: "dashboard/performance_stats", layout: false
  end

  def user_leaderboard_ratings(profile = nil)
    scope = if profile
              profile.leaderboard_ratings
            else
              LeaderboardRating.where(profile_id: current_user.profile_ids)
            end

    scope = scope.includes(:leaderboard)
    scope = scope.joins(:leaderboard).where(leaderboards: { organization_id: @scoped_organization.id }) if @scoped_organization
    scope
  end

end
