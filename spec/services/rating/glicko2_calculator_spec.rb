require "rails_helper"

RSpec.describe Rating::Glicko2Calculator do
  let(:calculator) { described_class.new }

  describe "#update" do
    it "matches the published Glicko-2 example" do
      state = { rating: 1500.0, rating_deviation: 200.0, volatility: 0.06 }
      results = [
        Rating::Glicko2Calculator::Result.new(opponent_rating: 1400, opponent_rd: 30, score: 1.0),
        Rating::Glicko2Calculator::Result.new(opponent_rating: 1550, opponent_rd: 100, score: 0.0),
        Rating::Glicko2Calculator::Result.new(opponent_rating: 1700, opponent_rd: 300, score: 0.0)
      ]

      updated = calculator.update(state, results)

      expect(updated[:rating]).to be_within(0.1).of(1464.06)
      expect(updated[:rating_deviation]).to be_within(0.1).of(151.52)
      expect(updated[:volatility]).to be_within(0.0001).of(0.05999)
    end

    it "inflates RD when no games are played" do
      state = { rating: 1500.0, rating_deviation: 50.0, volatility: 0.06 }

      updated = calculator.update(state, [])

      expect(updated[:rating]).to eq(1500.0)
      expect(updated[:rating_deviation]).to be > 50.0
      expect(updated[:volatility]).to eq(0.06)
    end
  end
end



