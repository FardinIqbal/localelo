require "rails_helper"

RSpec.describe MatchesController, type: :controller do
  include Devise::Test::ControllerHelpers

  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:leaderboard) { create(:leaderboard, organization: organization) }
  let(:profile) { create(:profile, user: user, organization: organization) }

  before do
    create(:organization_membership, profile: profile, organization: organization)
    sign_in user
  end

  describe "GET #index" do
    before do
      create_list(:match, 25, leaderboard: leaderboard, profile1: profile)
    end

    it "paginates matches with Kaminari helpers" do
      get :index, params: { page: 2 }

      matches = assigns(:matches)

      expect(matches).to respond_to(:current_page)
      expect(matches.current_page).to eq(2)
      expect(matches.limit_value).to eq(20)
    end
  end
end
