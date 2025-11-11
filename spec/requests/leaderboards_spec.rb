require "rails_helper"

RSpec.describe "Leaderboards", type: :request do
  include Devise::Test::IntegrationHelpers

  let(:organization) { create(:organization) }
  let(:leaderboard) { create(:leaderboard, organization: organization) }
  let(:user) { create(:user) }
  let(:profile) { create(:profile, user: user, organization: organization) }

  shared_examples "denies leaderboard access" do
    it "redirects away from the leaderboard index" do
      membership
      sign_in user

      get organization_leaderboards_path(organization)

      expect(response).to redirect_to(organizations_path)
      follow_redirect!
      expect(response.body).to include("You must be an approved member")
    end

    it "redirects away from the leaderboard show page" do
      membership
      sign_in user

      get organization_leaderboard_path(organization, leaderboard)

      expect(response).to redirect_to(organizations_path)
      follow_redirect!
      expect(response.body).to include("You must be an approved member")
    end
  end

  context "when membership is pending" do
    let(:membership) { create(:organization_membership, :pending, profile: profile) }

    include_examples "denies leaderboard access"
  end

  context "when membership is banned" do
    let(:membership) { create(:organization_membership, :banned, profile: profile) }

    include_examples "denies leaderboard access"
  end
end
