puts "Clearing existing data..."

Match.destroy_all
GymMembership.destroy_all  # Ensure memberships are deleted before gyms
User.destroy_all           # Destroy users next
Gym.destroy_all            # Now gyms can be safely deleted

puts "Old data removed ✅"

puts "Creating users..."
belts = ["White Belt", "Blue Belt", "Purple Belt", "Brown Belt", "Black Belt"]
users = []

10.times do |i|
  users << User.create!(
    email: "user#{i + 1}@bjjtest.com",
    password: "password",
    created_at: rand(1..12).months.ago
  )
end

puts "Users created: #{users.count} ✅"

puts "Creating gyms..."
gym_names = ["NYC BJJ Academy", "Gracie SF", "Ronin BJJ"]
gyms = gym_names.map do |name|
  Gym.create!(name: name, subdomain: name.parameterize)
end

puts "Gyms created: #{gyms.count} ✅"

puts "Assigning every user to every gym..."
gym_memberships = []

users.each do |user|
  gyms.each do |gym|  # Add every user to every gym
    gym_memberships << GymMembership.create!(
      user: user,
      gym: gym,
      elo: rand(1300..1800)  # Give them a random Elo score
    )
  end
end

puts "Gym memberships created: #{gym_memberships.count} ✅"

puts "Generating matches..."
matches = []

gyms.each do |gym|
  members = gym.users.to_a
  next if members.size < 2  # Skip if there's only 1 member

  5.times do
    player1, opponent = members.sample(2)  # Pick 2 random members
    winner = [player1, opponent].sample  # Randomly select winner

    matches << Match.create!(
      gym: gym,
      user1: player1,
      opponent_id: opponent.id,  # ✅ Uses `opponent_id` instead of `user2`
      winner: winner,
      match_time: Time.current,  # ✅ Ensures current time is used
      submission: %w[Armbar Triangle Kimura Decision Choke].sample
    )
  end
end

puts "Matches created: #{matches.count} ✅"
