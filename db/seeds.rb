# db/seeds.rb
require 'factory_bot_rails'
require 'faker'

puts "============================================="
puts "🌱 Starting comprehensive database seed process..."
puts "============================================="

# --- 1. Clean the Database ---
puts "\n🔥 Cleaning database..."
# Order matters to avoid foreign key constraint errors
# Delete in reverse dependency order (children before parents)
models_to_clean = [
  MatchParticipant,      # Depends on Match and Profile
  RatingHistory,         # Depends on Match, Profile, and Leaderboard
  Match,                 # Depends on Leaderboard
  LeaderboardRating,     # Depends on Profile and Leaderboard
  Leaderboard,           # Depends on Organization
  OrganizationRole,      # Depends on Organization and OrganizationMembership
  OrganizationMembership, # Depends on Profile and Organization
  Profile,               # Depends on User and Organization
  Organization,          # Depends on User (created_by)
  User
]

models_to_clean.each do |model|
  puts "  - Deleting all #{model.name} records"
  model.destroy_all
end
puts "✅ Database cleaned."

# --- 2. Create Users (Covering All Cases) ---
puts "\n👤 Creating users (covering all cases)..."

# Admin users
admin1 = User.create!(
  email: 'admin@example.com',
  password: 'password123',
  password_confirmation: 'password123'
)
puts "  ✓ Created admin user (admin@example.com)"

admin2 = User.create!(
  email: 'superadmin@example.com',
  password: 'password123',
  password_confirmation: 'password123'
)
puts "  ✓ Created super admin user"

# Regular users with various patterns
users = []
20.times do |i|
  users << User.create!(
    email: "user#{i + 1}@example.com",
    password: 'password',
    password_confirmation: 'password'
  )
end
puts "  ✓ Created 20 regular users"

# Users with Faker-generated emails
faker_users = []
10.times do
  faker_user = FactoryBot.create(:user)
  users << faker_user
  faker_users << faker_user
end
puts "  ✓ Created 10 users with Faker emails"

# Discarded users (soft-deleted)
3.times do |i|
  discarded_user = User.create!(
    email: "deleted#{i + 1}@example.com",
    password: 'password',
    password_confirmation: 'password'
  )
  discarded_user.discard
  users << discarded_user
end
puts "  ✓ Created 3 discarded users"

# Users with password reset tokens (simulating password reset flow)
reset_user = User.create!(
  email: 'reset@example.com',
  password: 'password',
  password_confirmation: 'password',
  reset_password_token: SecureRandom.hex(20),
  reset_password_sent_at: 1.hour.ago
)
users << reset_user
puts "  ✓ Created user with password reset token"

# Users with remember tokens
remember_user = User.create!(
  email: 'remember@example.com',
  password: 'password',
  password_confirmation: 'password',
  remember_created_at: 1.day.ago
)
users << remember_user
puts "  ✓ Created user with remember token"

puts "✅ Total users created: #{User.count}"

# --- 3. Create Organizations (Covering All Cases) ---
puts "\n🏢 Creating organizations (covering all cases)..."

# Open visibility organizations
open_orgs = []
5.times do |i|
  open_orgs << Organization.create!(
    name: "Open Organization #{i + 1}",
    subdomain: "open#{i + 1}",
    visibility: :open,
    description: Faker::Lorem.paragraph,
    location: Faker::Address.city,
    website: "https://#{Faker::Internet.domain_name}",
    created_by: admin1.id
  )
end
puts "  ✓ Created 5 open visibility organizations"

# Restricted visibility organizations
restricted_orgs = []
3.times do |i|
  restricted_orgs << Organization.create!(
    name: "Restricted Organization #{i + 1}",
    subdomain: "restricted#{i + 1}",
    visibility: :restricted,
    description: Faker::Lorem.paragraph,
    location: Faker::Address.city,
    website: "https://#{Faker::Internet.domain_name}",
    created_by: admin1.id
  )
end
puts "  ✓ Created 3 restricted visibility organizations"

# Organizations with minimal data
minimal_org = Organization.create!(
  name: "Minimal Org",
  subdomain: "minimal",
  visibility: :open,
  created_by: admin1.id
)
puts "  ✓ Created organization with minimal data"

# Organizations with no description
no_desc_org = Organization.create!(
  name: "No Description Org",
  subdomain: "nodesc",
  visibility: :open,
  location: Faker::Address.city,
  created_by: admin1.id
)
puts "  ✓ Created organization without description"

# Organizations with no website
no_website_org = Organization.create!(
  name: "No Website Org",
  subdomain: "nowebsite",
  visibility: :open,
  description: Faker::Lorem.paragraph,
  created_by: admin1.id
)
puts "  ✓ Created organization without website"

# Organizations with no location
no_location_org = Organization.create!(
  name: "No Location Org",
  subdomain: "nolocation",
  visibility: :open,
  description: Faker::Lorem.paragraph,
  website: "https://#{Faker::Internet.domain_name}",
  created_by: admin1.id
)
puts "  ✓ Created organization without location"

# Organization with no members (edge case)
empty_org = Organization.create!(
  name: "Empty Organization",
  subdomain: "empty",
  visibility: :open,
  created_by: admin1.id
)
puts "  ✓ Created empty organization (no members)"

all_organizations = open_orgs + restricted_orgs + [minimal_org, no_desc_org, no_website_org, no_location_org, empty_org]
puts "✅ Total organizations created: #{Organization.count}"

# --- 4. Create Profiles (Covering All Cases) ---
puts "\n👥 Creating profiles (covering all cases)..."

# Profiles for admin users
all_organizations.each do |org|
  next if org == empty_org # Skip empty org
  
  profile = Profile.create!(
    user: admin1,
    organization: org,
    username: "admin_#{org.subdomain}",
    first_name: "Admin",
    last_name: "User"
  )
  puts "  ✓ Created admin profile for #{org.name}"
end

# Profiles with full names
users.first(10).each_with_index do |user, i|
  org = all_organizations[i % all_organizations.size]
  next if org == empty_org
  
  Profile.create!(
    user: user,
    organization: org,
    username: "fullname#{i}",
    first_name: Faker::Name.first_name,
    last_name: Faker::Name.last_name
  )
end
puts "  ✓ Created profiles with full names"

# Profiles with only first name
users[10..15].each_with_index do |user, i|
  org = all_organizations[(i + 10) % all_organizations.size]
  next if org == empty_org
  
  Profile.create!(
    user: user,
    organization: org,
    username: "firstonly#{i}",
    first_name: Faker::Name.first_name
  )
end
puts "  ✓ Created profiles with only first name"

# Profiles with only last name
users[16..20].each_with_index do |user, i|
  org = all_organizations[(i + 16) % all_organizations.size]
  next if org == empty_org
  
  Profile.create!(
    user: user,
    organization: org,
    username: "lastonly#{i}",
    last_name: Faker::Name.last_name
  )
end
puts "  ✓ Created profiles with only last name"

# Profiles with no first/last name (username only)
users[21..25].each_with_index do |user, i|
  org = all_organizations[(i + 21) % all_organizations.size]
  next if org == empty_org
  
  Profile.create!(
    user: user,
    organization: org,
    username: "usernameonly#{i}"
  )
end
puts "  ✓ Created profiles with username only"

# Users with multiple profiles (members of multiple orgs)
multi_org_users = users[26..30]
multi_org_users.each_with_index do |user, i|
  orgs_to_join = all_organizations.reject { |o| o == empty_org }.sample(3)
  orgs_to_join.each_with_index do |org, j|
    Profile.create!(
      user: user,
      organization: org,
      username: "multi#{i}_#{j}",
      first_name: Faker::Name.first_name,
      last_name: Faker::Name.last_name
    )
  end
end
puts "  ✓ Created users with multiple organization memberships"

# Users with no profiles (edge case)
puts "  ✓ Created #{users.size - multi_org_users.size - 26} users with no profiles (edge case)"

puts "✅ Total profiles created: #{Profile.count}"

# --- 5. Create Organization Memberships (Covering All Cases) ---
puts "\n🤝 Creating organization memberships (covering all cases)..."

# Approved memberships
Profile.where.not(organization: empty_org).each do |profile|
  membership = OrganizationMembership.create!(
    profile: profile,
    organization: profile.organization,
    status: :approved
  )
end
puts "  ✓ Created approved memberships for all profiles"

# Pending memberships (for restricted orgs)
restricted_orgs.each do |org|
  3.times do |i|
    user = users.sample
    next if Profile.exists?(user: user, organization: org)
    
    profile = Profile.create!(
      user: user,
      organization: org,
      username: "pending#{org.id}_#{i}"
    )
    OrganizationMembership.create!(
      profile: profile,
      organization: org,
      status: :pending
    )
  end
end
puts "  ✓ Created pending memberships for restricted organizations"

# Banned memberships
open_orgs.first(2).each do |org|
  2.times do |i|
    user = users.sample
    next if Profile.exists?(user: user, organization: org)
    
    profile = Profile.create!(
      user: user,
      organization: org,
      username: "banned#{org.id}_#{i}"
    )
    OrganizationMembership.create!(
      profile: profile,
      organization: org,
      status: :banned
    )
  end
end
puts "  ✓ Created banned memberships"

# Memberships transitioning from pending to approved (simulate approval flow)
pending_memberships = OrganizationMembership.pending.limit(2)
pending_memberships.each do |membership|
  # Update existing membership status to approved (simulating approval flow)
  membership.update!(status: :approved)
end
puts "  ✓ Simulated membership approval transitions"

puts "✅ Total memberships created: #{OrganizationMembership.count}"
puts "  - Approved: #{OrganizationMembership.approved.count}"
puts "  - Pending: #{OrganizationMembership.pending.count}"
puts "  - Banned: #{OrganizationMembership.banned.count}"

# --- 6. Create Organization Roles (Covering All Cases) ---
puts "\n👑 Creating organization roles (covering all cases)..."

# Owners (one per organization)
all_organizations.each do |org|
  next if org == empty_org
  
  admin_profile = Profile.find_by(user: admin1, organization: org)
  next unless admin_profile
  
  membership = admin_profile.organization_membership
  next unless membership&.approved?
  
  OrganizationRole.create!(
    organization: org,
    organization_membership: membership,
    owner: true,
    admin: true # Owners are always admins
  )
end
puts "  ✓ Created owner roles (one per organization)"

# Admins (multiple per organization)
all_organizations.reject { |o| o == empty_org }.each do |org|
  approved_memberships = org.organization_memberships.approved.limit(3)
  approved_memberships.each do |membership|
    next if membership.organization_role&.owner? # Skip owners
    
    OrganizationRole.create!(
      organization: org,
      organization_membership: membership,
      admin: true,
      owner: false
    )
  end
end
puts "  ✓ Created admin roles (multiple per organization)"

# Regular members (no role) - already created above
puts "  ✓ Regular members exist without roles (edge case)"

puts "✅ Total roles created: #{OrganizationRole.count}"
puts "  - Owners: #{OrganizationRole.owners.count}"
puts "  - Admins: #{OrganizationRole.admins.count}"

# --- 7. Create Leaderboards (Covering All Cases) ---
puts "\n🏆 Creating leaderboards (covering all cases)..."

leaderboards = []

# Leaderboards with descriptions
all_organizations.reject { |o| o == empty_org }.each do |org|
  sport = %w[bjj chess tennis table_tennis judo fencing boxing wrestling go esports].sample
  
  leaderboard = Leaderboard.create!(
    organization: org,
    name: "#{sport.capitalize} Main",
    description: Faker::Lorem.paragraph,
    sport: sport
  )
  leaderboards << leaderboard
end
puts "  ✓ Created leaderboards with descriptions"

# Leaderboards without descriptions
all_organizations.reject { |o| o == empty_org }.sample(3).each do |org|
  sport = %w[bjj chess tennis].sample
  leaderboard = Leaderboard.create!(
    organization: org,
    name: "#{sport.capitalize} Secondary",
    sport: sport
  )
  leaderboards << leaderboard
end
puts "  ✓ Created leaderboards without descriptions"

# Multiple leaderboards per organization
open_orgs.first(2).each do |org|
  2.times do |i|
    leaderboard = Leaderboard.create!(
      organization: org,
      name: "Leaderboard #{i + 1}",
      description: Faker::Lorem.sentence,
      sport: %w[bjj chess tennis].sample
    )
    leaderboards << leaderboard
  end
end
puts "  ✓ Created multiple leaderboards per organization"

# Leaderboard with no matches (edge case)
empty_leaderboard = Leaderboard.create!(
  organization: open_orgs.first,
  name: "Empty Leaderboard",
  sport: "bjj"
)
leaderboards << empty_leaderboard
puts "  ✓ Created leaderboard with no matches (edge case)"

# Leaderboard with no members (edge case - for empty org)
empty_org_leaderboard = Leaderboard.create!(
  organization: empty_org,
  name: "Empty Org Leaderboard",
  sport: "chess"
)
leaderboards << empty_org_leaderboard
puts "  ✓ Created leaderboard for empty organization (edge case)"

puts "✅ Total leaderboards created: #{Leaderboard.count}"

# --- 8. Create Leaderboard Ratings (Covering All Cases) ---
puts "\n📈 Creating leaderboard ratings (covering all cases)..."

# Initial ratings for all approved members (auto-created by callback, but we'll verify)
Leaderboard.find_each do |leaderboard|
  org = leaderboard.organization
  approved_profiles = org.organization_memberships.approved.includes(:profile).map(&:profile)
  
  approved_profiles.each do |profile|
    rating = LeaderboardRating.find_or_create_by!(
      profile: profile,
      leaderboard: leaderboard
    ) do |r|
      r.rating = 1500.0
      r.rating_deviation = 350.0
      r.volatility = 0.06
      r.wins = 0
      r.losses = 0
      r.draws = 0
    end
  end
end
puts "  ✓ Created initial ratings for all approved members"

# Ratings with various win/loss/draw counts
some_ratings = LeaderboardRating.limit(10)
some_ratings.each do |rating|
  rating.update!(
    wins: rand(0..50),
    losses: rand(0..50),
    draws: rand(0..10)
  )
end
puts "  ✓ Updated ratings with various win/loss/draw counts"

# High-rated players
high_rated = LeaderboardRating.limit(5)
high_rated.each do |rating|
  rating.update!(
    rating: rand(1800..2200),
    wins: rand(30..50),
    losses: rand(0..10),
    rating_deviation: rand(50..150),
    volatility: rand(0.04..0.06)
  )
end
puts "  ✓ Created high-rated players"

# Low-rated players
low_rated = LeaderboardRating.limit(5)
low_rated.each do |rating|
  rating.update!(
    rating: rand(1000..1300),
    wins: rand(0..10),
    losses: rand(30..50),
    rating_deviation: rand(200..350),
    volatility: rand(0.06..0.10)
  )
end
puts "  ✓ Created low-rated players"

# New players (zero games)
new_players = LeaderboardRating.where(wins: 0, losses: 0, draws: 0).limit(5)
puts "  ✓ Created new players with zero games (edge case)"

# Players with only draws
draw_only = LeaderboardRating.limit(2)
draw_only.each do |rating|
  rating.update!(
    wins: 0,
    losses: 0,
    draws: rand(5..15),
    rating: 1500.0
  )
end
puts "  ✓ Created players with only draws (edge case)"

# Players with only wins
win_only = LeaderboardRating.limit(2)
win_only.each do |rating|
  rating.update!(
    wins: rand(10..20),
    losses: 0,
    draws: 0,
    rating: rand(1600..1800)
  )
end
puts "  ✓ Created players with only wins (edge case)"

# Players with only losses
loss_only = LeaderboardRating.limit(2)
loss_only.each do |rating|
  rating.update!(
    wins: 0,
    losses: rand(10..20),
    draws: 0,
    rating: rand(1200..1400)
  )
end
puts "  ✓ Created players with only losses (edge case)"

# Ratings with recent activity
recent_activity = LeaderboardRating.limit(10)
recent_activity.each do |rating|
  rating.update!(
    last_rated_at: rand(1.day.ago..Time.current)
  )
end
puts "  ✓ Created ratings with recent activity timestamps"

# Ratings with old activity
old_activity = LeaderboardRating.limit(5)
old_activity.each do |rating|
  rating.update!(
    last_rated_at: rand(6.months.ago..1.year.ago)
  )
end
puts "  ✓ Created ratings with old activity timestamps"

puts "✅ Total ratings created: #{LeaderboardRating.count}"

# --- 9. Create Matches (Covering All Cases) ---
puts "\n⚔️ Creating matches (covering all cases)..."

matches = []

# Active matches with winners
50.times do |i|
  leaderboard = leaderboards.reject { |lb| lb == empty_leaderboard || lb == empty_org_leaderboard }.sample
  org = leaderboard.organization
  eligible_profiles = org.organization_memberships.approved.includes(:profile).map(&:profile)
  next if eligible_profiles.count < 2
  
  profile1, profile2 = eligible_profiles.sample(2)
  winner = [profile1, profile2].sample
  
  match = Match.new(
    leaderboard: leaderboard,
    match_time: Faker::Time.between(from: 1.month.ago, to: Time.current),
    is_draw: false,
    status: :active,
    winner_profile_id: winner.id
  )
  
  match.match_participants.build([
    { profile: profile1, is_winner: profile1 == winner },
    { profile: profile2, is_winner: profile2 == winner }
  ])
  
  match.save!
  matches << match
end
puts "  ✓ Created 50 active matches with winners"

# Draw matches
10.times do |i|
  leaderboard = leaderboards.reject { |lb| lb == empty_leaderboard || lb == empty_org_leaderboard }.sample
  org = leaderboard.organization
  eligible_profiles = org.organization_memberships.approved.includes(:profile).map(&:profile)
  next if eligible_profiles.count < 2
  
  profile1, profile2 = eligible_profiles.sample(2)
  
  match = Match.new(
    leaderboard: leaderboard,
    match_time: Faker::Time.between(from: 1.month.ago, to: Time.current),
    is_draw: true,
    status: :active,
    winner_profile_id: nil
  )
  
  match.match_participants.build([
    { profile: profile1, is_winner: false },
    { profile: profile2, is_winner: false }
  ])
  
  match.save!
  matches << match
end
puts "  ✓ Created 10 draw matches"

# Invalidated matches
5.times do |i|
  leaderboard = leaderboards.reject { |lb| lb == empty_leaderboard || lb == empty_org_leaderboard }.sample
  org = leaderboard.organization
  eligible_profiles = org.organization_memberships.approved.includes(:profile).map(&:profile)
  next if eligible_profiles.count < 2
  
  profile1, profile2 = eligible_profiles.sample(2)
  winner = profile1
  
  match = Match.new(
    leaderboard: leaderboard,
    match_time: Faker::Time.between(from: 2.months.ago, to: 1.month.ago),
    is_draw: false,
    status: :invalidated,
    winner_profile_id: winner.id
  )
  
  match.match_participants.build([
    { profile: profile1, is_winner: true },
    { profile: profile2, is_winner: false }
  ])
  
  match.save!
  matches << match
end
puts "  ✓ Created 5 invalidated matches"

# Matches from different time periods
# Recent matches
20.times do
  leaderboard = leaderboards.reject { |lb| lb == empty_leaderboard || lb == empty_org_leaderboard }.sample
  org = leaderboard.organization
  eligible_profiles = org.organization_memberships.approved.includes(:profile).map(&:profile)
  next if eligible_profiles.count < 2
  
  profile1, profile2 = eligible_profiles.sample(2)
  winner = [profile1, profile2].sample
  
  match = Match.new(
    leaderboard: leaderboard,
    match_time: Faker::Time.between(from: 1.day.ago, to: Time.current),
    is_draw: false,
    status: :active,
    winner_profile_id: winner.id
  )
  
  match.match_participants.build([
    { profile: profile1, is_winner: profile1 == winner },
    { profile: profile2, is_winner: profile2 == winner }
  ])
  
  match.save!
  matches << match
end
puts "  ✓ Created 20 recent matches"

# Old matches
30.times do
  leaderboard = leaderboards.reject { |lb| lb == empty_leaderboard || lb == empty_org_leaderboard }.sample
  org = leaderboard.organization
  eligible_profiles = org.organization_memberships.approved.includes(:profile).map(&:profile)
  next if eligible_profiles.count < 2
  
  profile1, profile2 = eligible_profiles.sample(2)
  winner = [profile1, profile2].sample
  
  match = Match.new(
    leaderboard: leaderboard,
    match_time: Faker::Time.between(from: 1.year.ago, to: 6.months.ago),
    is_draw: false,
    status: :active,
    winner_profile_id: winner.id
  )
  
  match.match_participants.build([
    { profile: profile1, is_winner: profile1 == winner },
    { profile: profile2, is_winner: profile2 == winner }
  ])
  
  match.save!
  matches << match
end
puts "  ✓ Created 30 old matches"

# Matches between same players (rivalry)
rivalry_memberships = OrganizationMembership.approved.includes(:profile).limit(2)
rivalry_profiles = rivalry_memberships.map(&:profile).compact
if rivalry_profiles.count == 2
  leaderboard = leaderboards.reject { |lb| lb == empty_leaderboard || lb == empty_org_leaderboard }.first
  if leaderboard && rivalry_profiles.all? { |p| p.organization == leaderboard.organization }
    5.times do |i|
      winner = i.even? ? rivalry_profiles.first : rivalry_profiles.second
      
      match = Match.new(
        leaderboard: leaderboard,
        match_time: Faker::Time.between(from: 1.month.ago, to: Time.current),
        is_draw: false,
        status: :active,
        winner_profile_id: winner.id
      )
      
      match.match_participants.build([
        { profile: rivalry_profiles.first, is_winner: rivalry_profiles.first == winner },
        { profile: rivalry_profiles.second, is_winner: rivalry_profiles.second == winner }
      ])
      
      match.save!
      matches << match
    end
    puts "  ✓ Created 5 matches between same players (rivalry)"
  end
end

# Matches with rated_at timestamps
rated_matches = matches.sample(20)
rated_matches.each do |match|
  match.update!(rated_at: match.match_time + rand(1.minute..1.hour))
end
puts "  ✓ Set rated_at timestamps for 20 matches"

puts "✅ Total matches created: #{Match.count}"
puts "  - Active: #{Match.active.count}"
puts "  - Invalidated: #{Match.invalidated.count}"
puts "  - Draws: #{Match.where(is_draw: true).count}"
puts "  - With winners: #{Match.where.not(winner_profile_id: nil).count}"

# --- 10. Create Match Participants (Covering All Cases) ---
puts "\n👥 Creating match participants (covering all cases)..."

# Participants with rating snapshots (before/after)
Match.active.limit(30).each do |match|
  match.match_participants.each do |participant|
    rating = LeaderboardRating.find_by(
      profile: participant.profile,
      leaderboard: match.leaderboard
    )
    
    if rating
      participant.update!(
        rating_before_match: rating.rating,
        rating_deviation_before_match: rating.rating_deviation,
        volatility_before_match: rating.volatility,
        rating_after_match: rating.rating + rand(-50..50),
        rating_deviation_after_match: [rating.rating_deviation - 10, 50].max,
        volatility_after_match: rating.volatility
      )
    end
  end
end
puts "  ✓ Created participants with rating snapshots"

puts "✅ Total participants created: #{MatchParticipant.count}"
puts "  - Winners: #{MatchParticipant.winners.count}"
puts "  - Losers: #{MatchParticipant.losers.count}"

# --- 11. Create Rating Histories (Covering All Cases) ---
puts "\n📊 Creating rating histories (covering all cases)..."

# Rating histories for all matches
Match.active.each do |match|
  match.match_participants.each do |participant|
    rating = LeaderboardRating.find_by(
      profile: participant.profile,
      leaderboard: match.leaderboard
    )
    
    if rating
      RatingHistory.create!(
        profile: participant.profile,
        leaderboard: match.leaderboard,
        match: match,
        rating: participant.rating_after_match || rating.rating,
        rating_deviation: participant.rating_deviation_after_match || rating.rating_deviation,
        volatility: participant.volatility_after_match || rating.volatility
      )
    end
  end
end
puts "  ✓ Created rating histories for all active matches"

puts "✅ Total rating histories created: #{RatingHistory.count}"

# --- 12. Final Summary ---
puts "\n============================================="
puts "🎉 Comprehensive seed process completed! 🎉"
puts "============================================="
puts "\n📊 Database Statistics:"
puts "  Users:"
puts "    - Total: #{User.count}"
puts "    - Kept: #{User.kept.count}"
puts "    - Discarded: #{User.discarded.count}"
puts ""
puts "  Organizations:"
puts "    - Total: #{Organization.count}"
puts "    - Open: #{Organization.open.count}"
puts "    - Restricted: #{Organization.restricted.count}"
puts ""
puts "  Profiles:"
puts "    - Total: #{Profile.count}"
puts ""
puts "  Memberships:"
puts "    - Total: #{OrganizationMembership.count}"
puts "    - Approved: #{OrganizationMembership.approved.count}"
puts "    - Pending: #{OrganizationMembership.pending.count}"
puts "    - Banned: #{OrganizationMembership.banned.count}"
puts ""
puts "  Roles:"
puts "    - Total: #{OrganizationRole.count}"
puts "    - Owners: #{OrganizationRole.owners.count}"
puts "    - Admins: #{OrganizationRole.admins.count}"
puts ""
puts "  Leaderboards:"
puts "    - Total: #{Leaderboard.count}"
puts ""
puts "  Ratings:"
puts "    - Total: #{LeaderboardRating.count}"
puts "    - High-rated (1800+): #{LeaderboardRating.where('rating >= ?', 1800).count}"
puts "    - Low-rated (<1300): #{LeaderboardRating.where('rating < ?', 1300).count}"
puts "    - New players (0 games): #{LeaderboardRating.where(wins: 0, losses: 0, draws: 0).count}"
puts ""
puts "  Matches:"
puts "    - Total: #{Match.count}"
puts "    - Active: #{Match.active.count}"
puts "    - Invalidated: #{Match.invalidated.count}"
puts "    - Draws: #{Match.where(is_draw: true).count}"
puts ""
puts "  Match Participants:"
puts "    - Total: #{MatchParticipant.count}"
puts "    - Winners: #{MatchParticipant.winners.count}"
puts "    - Losers: #{MatchParticipant.losers.count}"
puts ""
puts "  Rating Histories:"
puts "    - Total: #{RatingHistory.count}"
puts ""
puts "\n🔑 Login Credentials:"
puts ""
puts "  📧 Admin Users:"
puts "    • admin@example.com / password123"
puts "    • superadmin@example.com / password123"
puts ""
puts "  👤 Regular Users (user1@example.com through user20@example.com):"
puts "    Password: password"
20.times do |i|
  puts "    • user#{i + 1}@example.com / password"
end
puts ""
puts "  🎲 Faker-Generated Users (10 users with random emails):"
puts "    Password: password"
faker_users.each_with_index do |user, i|
  puts "    • #{user.email} / password"
end
puts ""
puts "  🗑️  Discarded Users (soft-deleted):"
puts "    Password: password"
3.times do |i|
  puts "    • deleted#{i + 1}@example.com / password"
end
puts ""
puts "  🔄 Special Users:"
puts "    • reset@example.com / password (has password reset token)"
puts "    • remember@example.com / password (has remember token)"
puts ""
puts "✨ Edge Cases Covered:"
puts "  ✓ Discarded users"
puts "  ✓ Users with password reset tokens"
puts "  ✓ Users with remember tokens"
puts "  ✓ Empty organizations"
puts "  ✓ Organizations with minimal data"
puts "  ✓ Profiles with partial names"
puts "  ✓ Users with multiple organization memberships"
puts "  ✓ Users with no profiles"
puts "  ✓ All membership statuses (approved, pending, banned)"
puts "  ✓ All role types (owner, admin, regular)"
puts "  ✓ Leaderboards with no matches"
puts "  ✓ Leaderboards for empty organizations"
puts "  ✓ Ratings with various win/loss/draw combinations"
puts "  ✓ High and low rated players"
puts "  ✓ New players with zero games"
puts "  ✓ Players with only wins/losses/draws"
puts "  ✓ Active and invalidated matches"
puts "  ✓ Draw matches"
puts "  ✓ Matches from different time periods"
puts "  ✓ Matches between same players"
puts "  ✓ Rating histories for all matches"
puts "=============================================\n"
