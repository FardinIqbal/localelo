require "rails_helper"

RSpec.describe "Searches", type: :request do
  describe "GET /search" do
    it "returns results across entities for a matching query" do
      organization = create(:organization, name: "Arcade Heroes")
      profile = create(:profile, username: "ArcadeAce", organization: organization)
      leaderboard = create(:leaderboard, organization: organization, name: "Arcade Championship")
      create(:match, leaderboard: leaderboard, profile1: profile, opponent_profile: create(:profile, organization: organization), winning_profile: profile)

      get search_path, params: { q: "arcade" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Arcade Heroes")
      expect(response.body).to include("ArcadeAce")
      expect(response.body).to include("Arcade Championship")
    end

    it "shows empty states when no results match" do
      get search_path, params: { q: "nope" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("No organizations match that search.")
      expect(response.body).to include("No profiles match that search.")
      expect(response.body).to include("No matches match that search.")
    end
  end
end
