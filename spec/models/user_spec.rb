require "rails_helper"

RSpec.describe User, type: :model do
  describe "#most_frequent_opponent" do
    let(:organization) { create(:organization) }
    let(:leaderboard) { create(:leaderboard, organization: organization) }
    let(:user) { create(:user) }
    let(:opponent_user) { create(:user) }

    let(:user_profile) { create(:profile, user: user, organization: organization) }
    let(:opponent_profile) { create(:profile, user: opponent_user, organization: organization) }

    before do
      create(:organization_membership, profile: user_profile, organization: organization, status: :approved)
      create(:organization_membership, profile: opponent_profile, organization: organization, status: :approved)

      create(:match,
             leaderboard: leaderboard,
             profile1: user_profile,
             opponent_profile: opponent_profile,
             winning_profile: user_profile)
    end

    it "ignores opponents whose membership becomes pending" do
      create(:match,
             leaderboard: leaderboard,
             profile1: user_profile,
             opponent_profile: opponent_profile,
             winning_profile: opponent_profile)

      expect(user.most_frequent_opponent).to eq(opponent_user)

      opponent_profile.organization_membership.update!(status: :pending)

      expect(user.most_frequent_opponent).to be_nil
    end

    it "ignores opponents whose membership becomes banned" do
      expect(user.most_frequent_opponent).to eq(opponent_user)

      opponent_profile.organization_membership.update!(status: :banned)

      expect(user.most_frequent_opponent).to be_nil
    end
  end
end
