# db/seeds.rb
require 'factory_bot_rails'
require 'faker'

puts "============================================="
puts "🌱 Starting database seed process..."
puts "============================================="

# --- 1. Clean the Database ---
puts "\n🔥 Cleaning database..."
# Order matters to avoid foreign key constraint errors
models_to_clean = [
  MatchParticipant,
  Match,
  RatingHistory,
  LeaderboardRating,
  Leaderboard,
  OrganizationRole,
  OrganizationMembership,
  Profile,
  Organization,
  User
]

models_to_clean.each do |model|
  puts "  - Deleting all #{model.name} records"
  model.destroy_all
end
puts "✅ Database cleaned."

# --- 2. Create Admin and Users ---
puts "\n👤 Creating users..."
admin = FactoryBot.create(:user,
                          email: 'admin@example.com',
                          username: 'admin',
                          first_name: 'Admin',
                          last_name: 'User',
                          password: 'password123',
                          password_confirmation: 'password123')
puts "  - Created admin user (admin@example.com)"

NUM_USERS = 50
users = FactoryBot.create_list(:user, NUM_USERS)
puts "  - Created #{NUM_USERS} regular users."
puts "✅ Users created."

# --- 3. Create Organizations ---
puts "\n🏢 Creating organizations..."
ORGANIZATIONS_DATA = [
  { name: 'Stony Brook BJJ', sport: 'bjj', subdomain: 'sbbjj' },
  { name: 'Long Island Chess Nuts', sport: 'chess', subdomain: 'chessnuts' },
  { name: 'Hamptons Tennis Club', sport: 'tennis', subdomain: 'hamptons' },
  { name: 'NYC Go Association', sport: 'go', subdomain: 'nycgo' },
  { name: 'Brooklyn Table Tennis', sport: 'table_tennis', subdomain: 'brooklyntt' },
  { name: 'Queens Judo Dojo', sport: 'judo', subdomain: 'queensjudo' },
  { name: 'Manhattan Fencing Center', sport: 'fencing', subdomain: 'mfencing' },
  { name: 'Bronx Boxing Gym', sport: 'boxing', subdomain: 'bronxboxing' },
  { name: 'Staten Island Wrestling', sport: 'wrestling', subdomain: 'siwrestling' },
  { name: 'Global Gamers Guild', sport: 'esports', subdomain: 'ggg', visibility: 1 } # Restricted
]

organizations = ORGANIZATIONS_DATA.map do |org_data|
  FactoryBot.create(:organization,
                    name: org_data[:name],
                    subdomain: org_data[:subdomain],
                    visibility: org_data[:visibility] || 0,
                    created_by: admin.id)
end
puts "  - Created #{organizations.count} organizations."
puts "✅ Organizations created."

# --- 4. Create Memberships and Profiles ---
puts "\n🤝 Creating memberships and profiles..."
# Every user gets a profile for each organization they are a member of.
users.each_with_index do |user, index|
  # Each user joins a variable number of organizations
  num_orgs_to_join = rand(2..5)
  organizations.sample(num_orgs_to_join).each do |org|
    # Ensure profile is created before membership
    profile = FactoryBot.create(:profile, user: user, organization: org)

    status = :approved # default
    if org.visibility == 1 # Restricted org
      status = [:pending, :approved, :rejected].sample # More varied statuses for restricted orgs
    end

    # The first user in each org is an admin
    is_admin = (index == 0)

    membership = FactoryBot.create(:organization_membership,
                                   profile: profile,
                                   organization: org,
                                   status: status)

    if is_admin && membership.approved?
      FactoryBot.create(:organization_role, organization: org, organization_membership: membership, admin: true)
    end
  end
end

# Admin joins all organizations as an owner
organizations.each do |org|
  profile = FactoryBot.create(:profile, user: admin, organization: org)
  membership = FactoryBot.create(:organization_membership, profile: profile, organization: org, status: :approved)
  FactoryBot.create(:organization_role, organization: org, organization_membership: membership, owner: true)
end
puts "  - Created profiles and memberships for all users."
puts "✅ Memberships and profiles created."


# --- 5. Create Leaderboards ---
puts "\n🏆 Creating leaderboards..."
leaderboards = []
organizations.each_with_index do |org, i|
  sport = ORGANIZATIONS_DATA[i][:sport]
  leaderboard_names = case sport
                      when 'bjj' then ['Gi', 'No-Gi', 'Open Mat Rolls']
                      when 'chess' then ['Blitz (5-min)', 'Rapid (15-min)', 'Classical']
                      when 'tennis' then ['Singles', 'Doubles']
                      when 'esports' then ['League of Legends', 'Valorant', 'CS:GO']
                      else [Faker::Game.title, Faker::Game.title]
                      end

  leaderboard_names.each do |name|
    leaderboards << FactoryBot.create(:leaderboard,
                                      organization: org,
                                      name: name,
                                      sport: sport)
  end
end
puts "  - Created #{leaderboards.count} leaderboards."
puts "✅ Leaderboards created."

# --- 6. Create Initial Ratings ---
puts "\n📈 Creating initial ratings..."
Leaderboard.find_each do |leaderboard|
  # Get all approved members for the organization of this leaderboard
  approved_profiles = leaderboard.organization.organization_memberships.approved.includes(:profile)

  approved_profiles.each do |membership|
    LeaderboardRating.find_or_create_by!(
      profile: membership.profile,
      leaderboard: leaderboard
    )
  end
end
puts "  - Created initial ratings for all approved members on their respective leaderboards."
puts "✅ Initial ratings created."


# --- 7. Create a LOT of Matches ---
puts "\n⚔️ Creating a massive match history (this will take a moment)..."
MATCHES_TO_CREATE = 1000
super_active_users = users.sample(5) # A few users who play a lot

MATCHES_TO_CREATE.times do |i|
  print "\r  - Creating match #{i + 1}/#{MATCHES_TO_CREATE}... "

  leaderboard = leaderboards.sample
  organization = leaderboard.organization

  # 30% of matches involve a super active user
  use_super_active = rand < 0.3 && super_active_users.any?

  # Get approved profiles for this organization
  eligible_profiles = organization.organization_memberships.approved.includes(:profile).map(&:profile)
  next if eligible_profiles.count < 2

  profile1 = nil
  profile2 = nil

  if use_super_active
    # Ensure one player is a super active user who is a member of this org
    active_member_profiles = eligible_profiles.select { |p| super_active_users.include?(p.user) }
    if active_member_profiles.any?
      profile1 = active_member_profiles.sample
      # Find an opponent who is not the same person
      opponent_pool = eligible_profiles.reject { |p| p.id == profile1.id }
      profile2 = opponent_pool.sample
    end
  end

  # Fallback to random players if super active logic fails or isn't triggered
  unless profile1 && profile2
    profile1, profile2 = eligible_profiles.sample(2)
  end

  # If we still don't have two players, skip
  next unless profile1 && profile2

  is_draw = rand < 0.1 # 10% chance of a draw

  # Create the match using the factory, passing in profiles
  FactoryBot.create(:match,
                    leaderboard: leaderboard,
                    profile1: profile1,
                    opponent_profile: profile2,
                    is_draw: is_draw,
                    winning_profile: is_draw ? nil : [profile1, profile2].sample,
                    match_time: Faker::Time.between(from: 1.year.ago, to: Time.now))
end
puts "\n✅ Massive match history created."

# --- 8. Final Summary ---
puts "\n============================================="
puts "🎉 Seed process completed successfully! 🎉"
puts "============================================="
puts "Summary:"
puts "  - 1 Admin User"
puts "  - #{User.count - 1} Regular Users"
puts "  - #{Organization.count} Organizations"
puts "  - #{Leaderboard.count} Leaderboards"
puts "  - #{OrganizationMembership.count} Memberships"
puts "  - #{Profile.count} Profiles"
puts "  - #{LeaderboardRating.count} Initial Ratings"
puts "  - #{Match.count} Matches"
puts "\nLogin Credentials:"
puts "  - Admin: admin@example.com / password123"
puts "  - Users: e.g., #{users.first.email} / password"
puts "=============================================\n"