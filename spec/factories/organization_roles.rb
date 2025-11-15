FactoryBot.define do
  factory :organization_role do
    association :organization
    association :organization_membership
    admin { false }
    owner { false }
  end
end
