FactoryBot.define do
  factory :leaderboard do
    association :organization
    name { Faker::Game.unique.title }
    description { Faker::Lorem.sentence }

    # Common sports for demo data
    sport { %w[chess table_tennis bjj tennis].sample }
  end
end
