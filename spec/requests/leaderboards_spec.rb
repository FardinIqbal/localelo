require 'rails_helper'

RSpec.describe "Leaderboards", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/leaderboards/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/leaderboards/show"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/leaderboards/create"
      expect(response).to have_http_status(:success)
    end
  end

end
