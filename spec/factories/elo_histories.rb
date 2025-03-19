FactoryBot.define do
  factory :elo_history do
    user { nil }
    leaderboard { nil }
    elo { 1 }
  end
end
