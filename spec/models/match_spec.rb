require "rails_helper"

RSpec.describe Match, type: :model do
  let(:organization) { create(:organization) }
  let(:leaderboard) { create(:leaderboard, organization: organization) }
  let(:approved_profile) { create(:profile, organization: organization) }
  let(:opponent_profile) { create(:profile, organization: organization) }

  before do
    create(:organization_membership, profile: approved_profile, organization: organization, status: :approved)
  end

  it "is invalid when an opponent membership is pending" do
    create(:organization_membership, :pending, profile: opponent_profile, organization: organization)

    match = build(:match,
                  leaderboard: leaderboard,
                  profile1: approved_profile,
                  opponent_profile: opponent_profile,
                  winning_profile: approved_profile)

    expect(match).not_to be_valid
    expect(match.errors[:match_participants]).to include(/must be approved/)
  end

  it "is invalid when an opponent membership is banned" do
    create(:organization_membership, :banned, profile: opponent_profile, organization: organization)

    match = build(:match,
                  leaderboard: leaderboard,
                  profile1: approved_profile,
                  opponent_profile: opponent_profile,
                  winning_profile: approved_profile)

    expect(match).not_to be_valid
    expect(match.errors[:match_participants]).to include(/must be approved/)
  end
end
