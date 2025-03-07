require 'rails_helper'

RSpec.describe "OrganizationMemberships", type: :request do
  describe "GET /create" do
    it "returns http success" do
      get "/organization_memberships/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /destroy" do
    it "returns http success" do
      get "/organization_memberships/destroy"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /index" do
    it "returns http success" do
      get "/organization_memberships/index"
      expect(response).to have_http_status(:success)
    end
  end

end
