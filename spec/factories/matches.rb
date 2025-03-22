FactoryBot.define do
  factory :match do
    association :user1, factory: :user
    association :opponent, factory: :user
    association :leaderboard

    match_time { Faker::Time.between(from: 30.days.ago, to: Time.now) }
    elo_change { rand(5..25) }
    elo_at_time { 1500 }
    is_draw { false }
    verified { false }

    trait :verified do
      verified { true }
    end

    trait :with_winner do
      after(:build) do |match|
        match.winner = [match.user1, match.opponent].sample
      end
    end

    trait :draw do
      is_draw { true }
      winner { nil }
    end
  end
end
