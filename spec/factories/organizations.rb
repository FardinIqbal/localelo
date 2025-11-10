FactoryBot.define do
  factory :organization do
    name { Faker::Company.unique.name }
    description { Faker::Company.catch_phrase }
    location { Faker::Address.city }
    website { Faker::Internet.domain_name }
    visibility { 0 } # 0 = public, 1 = restricted
    subdomain { Faker::Internet.unique.domain_word }

  end
end
