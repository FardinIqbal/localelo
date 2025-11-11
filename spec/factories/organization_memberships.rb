# spec/factories/organization_memberships.rb
FactoryBot.define do
  factory :organization_membership do
    # Associations
    association :profile
    organization { profile.organization }

    # Default values
    status { :approved } # Use symbol instead of integer for better readability
    admin { false }

    # == Traits ==
    # Admin membership
    trait :admin do
      admin { true }
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

    # Admin and approved in one trait
    trait :admin_approved do
      admin { true }
      status { :approved }
    end
  end
end
