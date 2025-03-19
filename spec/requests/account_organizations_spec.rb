require 'rails_helper'

RSpec.describe "AccountOrganizations", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/account_organizations/index"
      expect(response).to have_http_status(:success)
    end
  end

end
