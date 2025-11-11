require "rails_helper"

RSpec.describe Leaderboard, type: :model do
  describe "callbacks" do
    describe "#add_organization_members_to_leaderboard" do
      it "creates ratings only for approved memberships" do
        organization = create(:organization)
        approved_profile = create(:profile, organization: organization)
        pending_profile = create(:profile, organization: organization)

        create(:organization_membership, profile: approved_profile, organization: organization, status: :approved)
        create(:organization_membership, :pending, profile: pending_profile, organization: organization)

        leaderboard = create(:leaderboard, organization: organization)

        ratings = leaderboard.leaderboard_ratings.pluck(:profile_id)

        expect(ratings).to contain_exactly(approved_profile.id)
      end
    end
  end
end
