require "rails_helper"

RSpec.describe "Matches", type: :request do
  describe "GET /matches/elo_preview" do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:profile) { create(:profile, user: user, organization: organization) }
    let!(:membership) { create(:organization_membership, profile: profile, organization: organization) }
    let(:opponent_user) { create(:user) }
    let!(:opponent_profile) { create(:profile, user: opponent_user, organization: organization) }
    let!(:opponent_membership) { create(:organization_membership, profile: opponent_profile, organization: organization) }
    let!(:leaderboard) { create(:leaderboard, organization: organization) }

    before do
      sign_in user
      LeaderboardRating.create!(leaderboard: leaderboard, profile: profile, rating: 1500)
      LeaderboardRating.create!(leaderboard: leaderboard, profile: opponent_profile, rating: 1520)
    end

    it "returns projected rating changes when inputs are valid" do
      get elo_preview_matches_path, params: {
        leaderboard_id: leaderboard.id,
        opponent_profile_id: opponent_profile.id,
        profile1_id: profile.id,
        winner_profile_id: profile.id
      }, headers: { "ACCEPT" => "application/json" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["player"]["change"]).to eq(16.93)
      expect(body["player"]["rating_after"]).to eq(1516.93)
      expect(body["opponent"]["change"]).to eq(-16.93)
      expect(body["opponent"]["rating_after"]).to eq(1503.07)
    end

    it "returns an error when the opponent is outside the leaderboard" do
      other_org = create(:organization)
      other_profile = create(:profile, organization: other_org)

      get elo_preview_matches_path, params: {
        leaderboard_id: leaderboard.id,
        opponent_profile_id: other_profile.id,
        profile1_id: profile.id,
        winner_profile_id: profile.id
      }, headers: { "ACCEPT" => "application/json" }

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["error"]).to include("Opponent is not part of this leaderboard")
    end
  end
end
