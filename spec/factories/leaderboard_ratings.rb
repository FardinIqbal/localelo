FactoryBot.define do
  factory :leaderboard_rating do
    association :user
    association :leaderboard
    rating { 1500 }
    wins { 0 }
    losses { 0 }
  end
end
