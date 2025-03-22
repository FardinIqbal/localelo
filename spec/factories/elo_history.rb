FactoryBot.define do
  factory :elo_history do
    association :user
    association :leaderboard
    elo { 1500 }
    recorded_at { Faker::Time.between(from: 30.days.ago, to: Time.now) }
  end
end
