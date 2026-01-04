import { db } from "./index";
import {
  users,
  organizations,
  organizationMemberships,
  leaderboards,
  leaderboardRatings,
  matches,
  matchParticipants,
  ratingHistory,
} from "./schema";
import { eq } from "drizzle-orm";

// Glicko-2 rating calculation (simplified for seeding)
function calculateRatingChange(
  winnerRating: number,
  loserRating: number,
  isDraw: boolean = false
): { winnerDelta: number; loserDelta: number } {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  if (isDraw) {
    return {
      winnerDelta: Math.round(K * (0.5 - expectedWinner)),
      loserDelta: Math.round(K * (0.5 - expectedLoser)),
    };
  }

  return {
    winnerDelta: Math.round(K * (1 - expectedWinner)),
    loserDelta: Math.round(K * (0 - expectedLoser)),
  };
}

// Generate random date in the past N days
function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 14) + 8); // 8am - 10pm
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// Shuffle array
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function seed() {
  console.log("Starting comprehensive seed...\n");

  // 1. Find or create the main user
  let [mainUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "iqbal11219@gmail.com"))
    .limit(1);

  if (!mainUser) {
    console.log("Main user not found, creating...");
    [mainUser] = await db
      .insert(users)
      .values({
        clerkId: "user_main_fardin",
        email: "iqbal11219@gmail.com",
        firstName: "Fardin",
        lastName: "Iqbal",
      })
      .returning();
    console.log("Created main user!");
  }

  console.log(`Main user: ${mainUser.email} (${mainUser.id})\n`);

  // 2. Create fake users for competitors
  const fakeUserData = [
    { firstName: "Marcus", lastName: "Silva", email: "marcus.silva@fake.local" },
    { firstName: "Jake", lastName: "Thompson", email: "jake.t@fake.local" },
    { firstName: "Alex", lastName: "Chen", email: "alex.chen@fake.local" },
    { firstName: "Sofia", lastName: "Rodriguez", email: "sofia.r@fake.local" },
    { firstName: "Ryan", lastName: "O'Brien", email: "ryan.ob@fake.local" },
    { firstName: "Emma", lastName: "Wilson", email: "emma.w@fake.local" },
    { firstName: "Lucas", lastName: "Kim", email: "lucas.kim@fake.local" },
    { firstName: "Mia", lastName: "Patel", email: "mia.patel@fake.local" },
    { firstName: "Noah", lastName: "Garcia", email: "noah.g@fake.local" },
    { firstName: "Olivia", lastName: "Martinez", email: "olivia.m@fake.local" },
    { firstName: "Ethan", lastName: "Brown", email: "ethan.b@fake.local" },
    { firstName: "Ava", lastName: "Lee", email: "ava.lee@fake.local" },
    { firstName: "Liam", lastName: "Davis", email: "liam.d@fake.local" },
    { firstName: "Isabella", lastName: "Wang", email: "isabella.w@fake.local" },
    { firstName: "Mason", lastName: "Taylor", email: "mason.t@fake.local" },
    { firstName: "Charlotte", lastName: "Anderson", email: "charlotte.a@fake.local" },
    { firstName: "James", lastName: "Moore", email: "james.m@fake.local" },
    { firstName: "Amelia", lastName: "Jackson", email: "amelia.j@fake.local" },
    { firstName: "Benjamin", lastName: "White", email: "ben.w@fake.local" },
    { firstName: "Harper", lastName: "Harris", email: "harper.h@fake.local" },
    { firstName: "Daniel", lastName: "Clark", email: "daniel.c@fake.local" },
    { firstName: "Evelyn", lastName: "Lewis", email: "evelyn.l@fake.local" },
    { firstName: "Henry", lastName: "Young", email: "henry.y@fake.local" },
    { firstName: "Scarlett", lastName: "Hall", email: "scarlett.h@fake.local" },
  ];

  console.log("Creating fake users...");
  const fakeUsers = await db
    .insert(users)
    .values(
      fakeUserData.map((u) => ({
        clerkId: `fake_${u.email.replace(/[@.]/g, "_")}`,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
      }))
    )
    .onConflictDoNothing()
    .returning();

  console.log(`Created ${fakeUsers.length} fake users\n`);

  // Get all users including existing fakes
  const allFakeUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, fakeUserData[0].email));

  const allUsers = [mainUser, ...fakeUsers];

  // 3. Create Organizations
  console.log("Creating organizations...");

  const orgsData = [
    {
      name: "Monarch Jiu Jitsu Academy",
      slug: "monarch-jiu-jitsu",
      description: "Premier BJJ academy in Long Island. All levels welcome.",
      location: "Long Island, NY",
      isOwner: true,
      leaderboards: [
        { name: "No-Gi Advanced", sport: "BJJ" },
        { name: "No-Gi Beginners", sport: "BJJ" },
        { name: "Gi Competition Team", sport: "BJJ" },
      ],
    },
    {
      name: "Stony Brook Dorm Ping Pong",
      slug: "sbu-ping-pong",
      description: "Unofficial table tennis rankings for H Quad",
      location: "Stony Brook University",
      isOwner: true,
      leaderboards: [
        { name: "Singles", sport: "Table Tennis" },
        { name: "Doubles", sport: "Table Tennis" },
      ],
    },
    {
      name: "NYC Chess Club",
      slug: "nyc-chess",
      description: "Weekly chess meetups in Manhattan",
      location: "New York, NY",
      isOwner: false,
      leaderboards: [
        { name: "Blitz (5min)", sport: "Chess" },
        { name: "Rapid (15min)", sport: "Chess" },
        { name: "Classical", sport: "Chess" },
      ],
    },
    {
      name: "Smash Bros Weekly",
      slug: "smash-weekly",
      description: "Super Smash Bros Ultimate tournaments every Friday",
      location: "Brooklyn, NY",
      isOwner: false,
      leaderboards: [
        { name: "Ultimate Singles", sport: "Esports" },
        { name: "Melee Singles", sport: "Esports" },
      ],
    },
    {
      name: "CrossFit Iron Valley",
      slug: "crossfit-iron-valley",
      description: "Competitive CrossFit box with in-house rankings",
      location: "Jersey City, NJ",
      isOwner: false,
      leaderboards: [
        { name: "WOD Leaderboard", sport: "CrossFit" },
        { name: "Weightlifting", sport: "CrossFit" },
      ],
    },
  ];

  for (const orgData of orgsData) {
    console.log(`\nCreating org: ${orgData.name}`);

    // Create org
    const [org] = await db
      .insert(organizations)
      .values({
        name: orgData.name,
        slug: orgData.slug,
        description: orgData.description,
        location: orgData.location,
        visibility: "public",
        createdById: mainUser.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!org) {
      console.log(`  Org ${orgData.slug} already exists, skipping...`);
      continue;
    }

    // Create main user membership
    const [mainMembership] = await db
      .insert(organizationMemberships)
      .values({
        organizationId: org.id,
        userId: mainUser.id,
        username: mainUser.firstName || "Fardin",
        status: "approved",
        isOwner: orgData.isOwner,
        isAdmin: orgData.isOwner,
      })
      .returning();

    console.log(`  Created membership for main user (owner: ${orgData.isOwner})`);

    // Select random subset of fake users for this org (8-18 members)
    const memberCount = Math.floor(Math.random() * 11) + 8;
    const selectedUsers = shuffle(fakeUsers).slice(0, memberCount);

    const membershipData = selectedUsers.map((u) => ({
      organizationId: org.id,
      userId: u.id,
      username: u.firstName || u.email.split("@")[0],
      status: "approved" as const,
      isOwner: false,
      isAdmin: Math.random() < 0.1, // 10% chance of being admin
    }));

    const memberships = await db
      .insert(organizationMemberships)
      .values(membershipData)
      .returning();

    console.log(`  Created ${memberships.length} member memberships`);

    const allMemberships = [mainMembership, ...memberships];

    // Create leaderboards
    for (const lbData of orgData.leaderboards) {
      console.log(`  Creating leaderboard: ${lbData.name}`);

      const [leaderboard] = await db
        .insert(leaderboards)
        .values({
          organizationId: org.id,
          name: lbData.name,
          sport: lbData.sport,
        })
        .returning();

      // Create ratings for all members with some variance
      const ratingsData = allMemberships.map((m, i) => {
        // Main user gets a competitive rating
        const isMainUser = m.userId === mainUser.id;
        const baseRating = isMainUser
          ? 1650 + Math.floor(Math.random() * 100)
          : 1400 + Math.floor(Math.random() * 300);

        return {
          leaderboardId: leaderboard.id,
          membershipId: m.id,
          rating: baseRating,
          ratingDeviation: 100 + Math.floor(Math.random() * 150),
          volatility: 0.05 + Math.random() * 0.02,
          wins: 0,
          losses: 0,
          draws: 0,
        };
      });

      const ratings = await db
        .insert(leaderboardRatings)
        .values(ratingsData)
        .returning();

      // Create match history (15-40 matches per leaderboard)
      const matchCount = Math.floor(Math.random() * 26) + 15;
      console.log(`    Creating ${matchCount} matches...`);

      // Track ratings as we simulate matches
      const ratingMap = new Map(ratings.map((r) => [r.membershipId, r.rating]));
      const winsMap = new Map(ratings.map((r) => [r.membershipId, 0]));
      const lossesMap = new Map(ratings.map((r) => [r.membershipId, 0]));
      const drawsMap = new Map(ratings.map((r) => [r.membershipId, 0]));

      for (let i = 0; i < matchCount; i++) {
        // Pick two random participants
        const shuffled = shuffle(allMemberships);
        const player1 = shuffled[0];
        const player2 = shuffled[1];

        const p1Rating = ratingMap.get(player1.id) || 1500;
        const p2Rating = ratingMap.get(player2.id) || 1500;

        // Determine outcome (higher rated player more likely to win)
        const p1WinProb = 1 / (1 + Math.pow(10, (p2Rating - p1Rating) / 400));
        const random = Math.random();
        const isDraw = random > 0.95; // 5% draws
        const p1Wins = !isDraw && random < p1WinProb;

        const winnerId = isDraw ? null : p1Wins ? player1.id : player2.id;

        // Calculate rating changes
        const { winnerDelta, loserDelta } = calculateRatingChange(
          p1Wins ? p1Rating : p2Rating,
          p1Wins ? p2Rating : p1Rating,
          isDraw
        );

        const matchDate = randomPastDate(90); // Last 90 days

        // Create match
        const [match] = await db
          .insert(matches)
          .values({
            leaderboardId: leaderboard.id,
            winnerMembershipId: winnerId,
            isDraw,
            status: "active",
            matchTime: matchDate,
            ratedAt: matchDate,
          })
          .returning();

        // Create participants
        const p1RatingBefore = p1Rating;
        const p2RatingBefore = p2Rating;
        const p1RatingAfter = isDraw
          ? p1Rating + (p1Rating > p2Rating ? loserDelta : winnerDelta)
          : p1Wins
          ? p1Rating + winnerDelta
          : p1Rating + loserDelta;
        const p2RatingAfter = isDraw
          ? p2Rating + (p2Rating > p1Rating ? loserDelta : winnerDelta)
          : p1Wins
          ? p2Rating + loserDelta
          : p2Rating + winnerDelta;

        await db.insert(matchParticipants).values([
          {
            matchId: match.id,
            membershipId: player1.id,
            isWinner: p1Wins && !isDraw,
            ratingBefore: p1RatingBefore,
            ratingAfter: p1RatingAfter,
          },
          {
            matchId: match.id,
            membershipId: player2.id,
            isWinner: !p1Wins && !isDraw,
            ratingBefore: p2RatingBefore,
            ratingAfter: p2RatingAfter,
          },
        ]);

        // Update rating maps
        ratingMap.set(player1.id, p1RatingAfter);
        ratingMap.set(player2.id, p2RatingAfter);

        // Update win/loss/draw counts
        if (isDraw) {
          drawsMap.set(player1.id, (drawsMap.get(player1.id) || 0) + 1);
          drawsMap.set(player2.id, (drawsMap.get(player2.id) || 0) + 1);
        } else if (p1Wins) {
          winsMap.set(player1.id, (winsMap.get(player1.id) || 0) + 1);
          lossesMap.set(player2.id, (lossesMap.get(player2.id) || 0) + 1);
        } else {
          winsMap.set(player2.id, (winsMap.get(player2.id) || 0) + 1);
          lossesMap.set(player1.id, (lossesMap.get(player1.id) || 0) + 1);
        }

        // Create rating history entries
        await db.insert(ratingHistory).values([
          {
            membershipId: player1.id,
            leaderboardId: leaderboard.id,
            matchId: match.id,
            rating: p1RatingAfter,
            ratingDeviation: 100 + Math.random() * 50,
            volatility: 0.05 + Math.random() * 0.02,
          },
          {
            membershipId: player2.id,
            leaderboardId: leaderboard.id,
            matchId: match.id,
            rating: p2RatingAfter,
            ratingDeviation: 100 + Math.random() * 50,
            volatility: 0.05 + Math.random() * 0.02,
          },
        ]);
      }

      // Update final ratings
      for (const rating of ratings) {
        const finalRating = ratingMap.get(rating.membershipId) || rating.rating;
        const wins = winsMap.get(rating.membershipId) || 0;
        const losses = lossesMap.get(rating.membershipId) || 0;
        const draws = drawsMap.get(rating.membershipId) || 0;

        await db
          .update(leaderboardRatings)
          .set({
            rating: finalRating,
            wins,
            losses,
            draws,
            lastRatedAt: new Date(),
          })
          .where(eq(leaderboardRatings.id, rating.id));
      }

      console.log(`    Matches created and ratings updated`);
    }
  }

  console.log("\n=== Seed Complete ===");
  console.log("Created:");
  console.log(`  - ${orgsData.length} organizations`);
  console.log(`  - ${fakeUsers.length} fake competitors`);
  console.log(`  - Multiple leaderboards with match history\n`);

  // Print summary for main user
  const mainUserOrgs = await db
    .select({
      org: organizations,
      membership: organizationMemberships,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
    .where(eq(organizationMemberships.userId, mainUser.id));

  console.log(`Your organizations (${mainUser.email}):`);
  for (const { org, membership } of mainUserOrgs) {
    console.log(`  - ${org.name} (${membership.isOwner ? "Owner" : "Member"})`);
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
