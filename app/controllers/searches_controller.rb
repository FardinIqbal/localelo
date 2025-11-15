class SearchesController < ApplicationController
  def show
    @query = params[:q].to_s.strip

    @organizations = Organization.none
    @profiles = Profile.none
    @matches = Match.none

    return if @query.blank?

    search_term = "%#{@query.downcase}%"

    @organizations = Organization
                       .includes(:leaderboards, :profiles)
                       .where(
                         "LOWER(organizations.name) LIKE :query OR LOWER(COALESCE(organizations.description, '')) LIKE :query OR LOWER(COALESCE(organizations.location, '')) LIKE :query",
                         query: search_term
                       )
                       .order(:name)
                       .page(params[:organizations_page])
                       .per(10)

    @profiles = Profile
                   .includes(:user, :organization)
                   .where(
                     "LOWER(profiles.username) LIKE :query OR LOWER(COALESCE(profiles.first_name, '')) LIKE :query OR LOWER(COALESCE(profiles.last_name, '')) LIKE :query",
                     query: search_term
                   )
                   .order(:username)
                   .page(params[:profiles_page])
                   .per(10)

    @matches = Match
                 .includes(:leaderboard, match_participants: { profile: :user })
                 .left_outer_joins(:leaderboard)
                 .left_outer_joins(match_participants: :profile)
                 .where(
                   "LOWER(COALESCE(leaderboards.name, '')) LIKE :query OR LOWER(COALESCE(leaderboards.sport, '')) LIKE :query OR LOWER(COALESCE(profiles.username, '')) LIKE :query",
                   query: search_term
                 )
                 .distinct
                 .order(created_at: :desc)
                 .page(params[:matches_page])
                 .per(10)
  end
end
