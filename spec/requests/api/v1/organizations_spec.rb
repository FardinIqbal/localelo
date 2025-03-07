require 'rails_helper'

RSpec.describe "Api::V1::Organizations", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/api/v1/organizations/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/api/v1/organizations/show"
      expect(response).to have_http_status(:success)
    end
  end

end
