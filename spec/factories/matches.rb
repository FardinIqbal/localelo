FactoryBot.define do
  factory :match do
    association :leaderboard, strategy: :create

    match_time { Faker::Time.between(from: 30.days.ago, to: Time.current) }
    is_draw { false }

    transient do
      profile1 { nil }
      opponent_profile { nil }
      winning_profile { nil }
    end

    after(:build) do |match, evaluator|
      organization = match.leaderboard.organization

      primary_profile = evaluator.profile1 || create(:profile, organization: organization)
      secondary_profile = evaluator.opponent_profile || create(:profile, organization: organization)

      primary_profile.save! unless primary_profile.persisted?
      secondary_profile.save! unless secondary_profile.persisted?

      match.match_participants.clear
      match.match_participants.build(profile: primary_profile)
      match.match_participants.build(profile: secondary_profile)

      match.match_participants.each { |participant| participant.is_winner = false }

      unless match.is_draw?
        winner = evaluator.winning_profile || primary_profile
        winner.save! unless winner.persisted?
        match.winner_profile = winner

        match.match_participants.each do |participant|
          participant.is_winner = participant.profile == winner
        end
      end
    end
  end
end
