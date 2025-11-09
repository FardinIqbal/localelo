# db/seeds.rb
require 'factory_bot_rails'

puts "Cleaning database..."
# Use destroy_all to ensure callbacks are triggered
[Match, EloHistory, LeaderboardRating, Leaderboard, OrganizationMembership, Organization, User].each(&:destroy_all)

puts "Creating admin user..."
admin = FactoryBot.create(:user,
                          email: 'admin@example.com',
                          username: 'admin',
                          password: 'password123',
                          password_confirmation: 'password123'
)

puts "Creating regular users..."
# Create users with predictable credentials for testing
users = 20.times.map do |i|
  FactoryBot.create(:user,
                    email: "user#{i+1}@example.com",
                    username: "user#{i+1}",
                    password: 'password123',
                    password_confirmation: 'password123'
  )
end

puts "Creating organizations..."
organizations = [
  { name: 'Downtown Chess Club', subdomain: 'chess', visibility: 0 },
  { name: 'City Table Tennis', subdomain: 'pingpong', visibility: 1 },
  { name: 'Local BJJ Academy', subdomain: 'bjj', visibility: 0 }
].map do |org_attrs|
  FactoryBot.create(:organization, org_attrs.merge(user: admin))
end

puts "Creating memberships..."
# Create admin memberships - using approved (1) instead of active
organizations.each do |org|
  FactoryBot.create(:organization_membership, user: admin, organization: org, admin: true, status: 1) # approved
end

# Create regular user memberships with varying participation
users.each.with_index do |user, index|
  FactoryBot.create(:organization_membership, user: user, organization: organizations[0], status: 1) # approved
  FactoryBot.create(:organization_membership, user: user, organization: organizations[1], status: 1) if index < 10 # approved
  FactoryBot.create(:organization_membership, user: user, organization: organizations[2], status: 1) if index < 15 # approved
end

puts "Creating leaderboards..."
leaderboards = [
  { organization: organizations[0], name: 'Blitz Chess', sport: 'chess' },
  { organization: organizations[0], name: 'Classical Chess', sport: 'chess' },
  { organization: organizations[1], name: 'Ping Pong Singles', sport: 'table_tennis' },
  { organization: organizations[2], name: 'Rolling Sessions', sport: 'bjj' }
].map { |lb_attrs| FactoryBot.create(:leaderboard, lb_attrs) }

puts "Creating initial ratings..."
leaderboards.each do |leaderboard|
  leaderboard.organization.users.each do |user|
    LeaderboardRating.find_or_create_by(user: user, leaderboard: leaderboard)
  end
end

puts "Creating match history..."
leaderboards.each do |leaderboard|
  30.times do
    eligible_users = leaderboard.organization.users.to_a
    next if eligible_users.count < 2

    players = eligible_users.sample(2)
    is_draw = [true, false, false, false].sample # 25% chance of draw

    match_attributes = {
      user1: players[0],
      opponent: players[1],
      leaderboard: leaderboard,
      match_time: Faker::Time.between(from: 30.days.ago, to: Time.now)
    }

    if is_draw
      # For draw matches, we need to handle winner differently based on your Match model
      match = FactoryBot.build(:match, match_attributes)
      match.is_draw = true
      match.winner = nil
      match.save!
    else
      match = FactoryBot.create(:match, :with_winner, match_attributes)
    end
  end
end

puts "Seed completed! You now have:"
puts "- 1 Admin + 20 Users"
puts "- 3 Organizations (Chess Club, Ping Pong, BJJ)"
puts "- 4 Leaderboards (2 in Chess, 1 in Ping Pong, 1 in BJJ)"
puts "- Ratings for every member in each relevant leaderboard"
puts "- 30 random matches per leaderboard, with rating updates and Elo history"
puts "\nLogin Credentials:"
puts "Admin: admin@example.com / password123"
puts "Users: user1@example.com through user20@example.com / password123"
