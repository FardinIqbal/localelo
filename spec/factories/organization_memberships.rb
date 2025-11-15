# spec/factories/organization_memberships.rb
FactoryBot.define do
  factory :organization_membership do
    # Associations
    association :profile
    organization { profile.organization }

    # Default values
    status { :approved } # Use symbol instead of integer for better readability

    # == Traits ==
    # Admin membership
    trait :admin do
      after(:create) do |membership|
        create(:organization_role, organization_membership: membership, organization: membership.organization, admin: true)
      end
    end

    # Pending membership request
    trait :pending do
      status { :pending }
    end

    # Banned membership
    trait :banned do
      status { :banned }
    end

    # Active member (alias for default)
    trait :active do
      status { :approved }
    end
  end
end
