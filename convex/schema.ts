import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users - synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // Organizations (gyms, clubs)
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
    createdBy: v.id("users"),
  })
    .index("by_slug", ["slug"])
    .index("by_createdBy", ["createdBy"]),

  // Organization memberships
  memberships: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    username: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("banned")
    ),
    isAdmin: v.boolean(),
    isOwner: v.boolean(),
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"])
    .index("by_org_username", ["organizationId", "username"]),

  // Invite links
  invites: defineTable({
    organizationId: v.id("organizations"),
    code: v.string(),
    createdBy: v.id("users"),
    maxUses: v.optional(v.number()),
    uses: v.number(),
    expiresAt: v.optional(v.number()), // Unix timestamp
  })
    .index("by_org", ["organizationId"])
    .index("by_code", ["code"]),

  // Leaderboards within organizations
  leaderboards: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    sport: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),

  // Player ratings on leaderboards (Glicko-2)
  ratings: defineTable({
    leaderboardId: v.id("leaderboards"),
    membershipId: v.id("memberships"),
    rating: v.number(), // Default 1500
    ratingDeviation: v.number(), // Default 350
    volatility: v.number(), // Default 0.06
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    lastRatedAt: v.optional(v.number()),
  })
    .index("by_leaderboard", ["leaderboardId"])
    .index("by_membership", ["membershipId"])
    .index("by_leaderboard_rating", ["leaderboardId", "rating"])
    .index("by_leaderboard_membership", ["leaderboardId", "membershipId"]),

  // Match records
  matches: defineTable({
    leaderboardId: v.id("leaderboards"),
    winnerMembershipId: v.optional(v.id("memberships")), // null for draws
    isDraw: v.boolean(),
    status: v.union(v.literal("active"), v.literal("invalidated")),
    matchTime: v.number(), // Unix timestamp
    ratedAt: v.optional(v.number()),
    // Soft delete for undo
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_leaderboard", ["leaderboardId"])
    .index("by_matchTime", ["matchTime"])
    .index("by_status", ["status"]),

  // Match participants (both players per match)
  matchParticipants: defineTable({
    matchId: v.id("matches"),
    membershipId: v.id("memberships"),
    isWinner: v.boolean(),
    // Rating snapshot before/after
    ratingBefore: v.optional(v.number()),
    ratingAfter: v.optional(v.number()),
    ratingDeviationBefore: v.optional(v.number()),
    ratingDeviationAfter: v.optional(v.number()),
    volatilityBefore: v.optional(v.number()),
    volatilityAfter: v.optional(v.number()),
  })
    .index("by_match", ["matchId"])
    .index("by_membership", ["membershipId"]),

  // Rating history for charts
  ratingHistory: defineTable({
    membershipId: v.id("memberships"),
    leaderboardId: v.id("leaderboards"),
    matchId: v.id("matches"),
    rating: v.number(),
    ratingDeviation: v.number(),
    volatility: v.number(),
    createdAt: v.number(),
  })
    .index("by_membership", ["membershipId"])
    .index("by_leaderboard", ["leaderboardId"])
    .index("by_match", ["matchId"]),

  // Recent opponents for quick-match UI
  recentOpponents: defineTable({
    membershipId: v.id("memberships"),
    opponentMembershipId: v.id("memberships"),
    leaderboardId: v.id("leaderboards"),
    matchCount: v.number(),
    lastPlayedAt: v.number(),
  })
    .index("by_member", ["membershipId"])
    .index("by_leaderboard", ["leaderboardId"])
    .index("by_member_opponent_leaderboard", [
      "membershipId",
      "opponentMembershipId",
      "leaderboardId",
    ]),

  // User streaks (daily activity)
  userStreaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActivityDate: v.optional(v.number()),
    freezesAvailable: v.number(),
    weekendAmuletActive: v.boolean(),
  }).index("by_user", ["userId"]),

  // Daily activity log
  dailyActivity: defineTable({
    userId: v.id("users"),
    activityDate: v.number(), // Unix timestamp (start of day)
    matchesPlayed: v.number(),
    xpEarned: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["activityDate"])
    .index("by_user_date", ["userId", "activityDate"]),

  // Weekly leagues
  weeklyLeagues: defineTable({
    tier: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum"),
      v.literal("diamond"),
      v.literal("champion")
    ),
    weekStart: v.number(),
    weekEnd: v.number(),
  })
    .index("by_tier", ["tier"])
    .index("by_week", ["weekStart"]),

  // League memberships
  leagueMemberships: defineTable({
    leagueId: v.id("weeklyLeagues"),
    userId: v.id("users"),
    weeklyXp: v.number(),
    finalRank: v.optional(v.number()),
    promoted: v.boolean(),
    demoted: v.boolean(),
  })
    .index("by_league", ["leagueId"])
    .index("by_user", ["userId"])
    .index("by_league_xp", ["leagueId", "weeklyXp"]),

  // User XP (lifetime progression)
  userXp: defineTable({
    userId: v.id("users"),
    totalXp: v.number(),
    weeklyXp: v.number(),
    currentTier: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum"),
      v.literal("diamond"),
      v.literal("champion")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_tier", ["currentTier"]),

  // Achievements/badges
  userAchievements: defineTable({
    userId: v.id("users"),
    achievementType: v.string(), // e.g., "first_win", "win_streak_5", etc.
    achievedAt: v.number(),
    metadata: v.optional(v.string()), // JSON string for extra data
  })
    .index("by_user", ["userId"])
    .index("by_type", ["achievementType"]),

  // Challenges between players
  challenges: defineTable({
    challengerRatingId: v.id("ratings"),
    challengedRatingId: v.id("ratings"),
    leaderboardId: v.id("leaderboards"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("expired"),
      v.literal("completed")
    ),
    message: v.optional(v.string()),
    matchId: v.optional(v.id("matches")),
    expiresAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_challenger", ["challengerRatingId"])
    .index("by_challenged", ["challengedRatingId"])
    .index("by_leaderboard", ["leaderboardId"])
    .index("by_status", ["status"]),

  // Push notification subscriptions
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Notification preferences
  notificationPreferences: defineTable({
    userId: v.id("users"),
    pushEnabled: v.boolean(),
    streakReminders: v.boolean(),
    rankChanges: v.boolean(),
    challengeAlerts: v.boolean(),
    leagueResults: v.boolean(),
    reminderTime: v.string(), // HH:MM format
  }).index("by_user", ["userId"]),
});
