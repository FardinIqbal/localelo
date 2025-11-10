FactoryBot.define do
  factory :profile do
    association :user
    association :organization
    sequence(:username) { |n| "player#{n}" }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
  end
end
