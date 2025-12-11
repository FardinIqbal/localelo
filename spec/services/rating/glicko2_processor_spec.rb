require "rails_helper"

RSpec.describe Rating::Glicko2Processor do
  let(:calculator) { Rating::Glicko2Calculator.new }

  it "updates ratings for pending matches on a leaderboard" do
    leaderboard = create(:leaderboard)
    profile_a = create(:profile, organization: leaderboard.organization)
    profile_b = create(:profile, organization: leaderboard.organization)
    create(:organization_membership, profile: profile_a, organization: leaderboard.organization, status: :approved)
    create(:organization_membership, profile: profile_b, organization: leaderboard.organization, status: :approved)

    match = create(:match, leaderboard: leaderboard, profile1: profile_a, opponent_profile: profile_b, winning_profile: profile_a)

    initial_state = { rating: 1500.0, rating_deviation: 350.0, volatility: 0.06 }
    expected_a = calculator.update(
      initial_state,
      [Rating::Glicko2Calculator::Result.new(opponent_rating: 1500.0, opponent_rd: 350.0, score: 1.0)]
    )
    expected_b = calculator.update(
      initial_state,
      [Rating::Glicko2Calculator::Result.new(opponent_rating: 1500.0, opponent_rd: 350.0, score: 0.0)]
    )

    described_class.new(leaderboard: leaderboard).call

    rating_a = LeaderboardRating.find_by!(leaderboard: leaderboard, profile: profile_a)
    rating_b = LeaderboardRating.find_by!(leaderboard: leaderboard, profile: profile_b)

    expect(rating_a.rating).to be_within(0.01).of(expected_a[:rating])
    expect(rating_a.rating_deviation).to be_within(0.01).of(expected_a[:rating_deviation])
    expect(rating_a.volatility).to be_within(0.0001).of(expected_a[:volatility])

    expect(rating_b.rating).to be_within(0.01).of(expected_b[:rating])
    expect(rating_b.rating_deviation).to be_within(0.01).of(expected_b[:rating_deviation])
    expect(rating_b.volatility).to be_within(0.0001).of(expected_b[:volatility])

    expect(match.reload.rated_at).not_to be_nil
    expect(RatingHistory.where(match: match).count).to eq(2)
  end
end



