FactoryBot.define do
  factory :organization do
    name { Faker::Company.unique.name }
    description { Faker::Company.catch_phrase }
    location { Faker::Address.city }
    website { Faker::Internet.domain_name }
    visibility { 0 } # 0 = public, 1 = restricted
    subdomain { Faker::Internet.unique.domain_word }

    # The user association is for the 'user_id' or 'created_by' field in the schema
    # If your Organization model `belongs_to :user`, or if you have a `created_by` foreign key,
    # match that logic as needed.

    association :user

    after(:build) do |org|
      org.created_by = org.user_id if org.respond_to?(:created_by=)
    end
  end
end
