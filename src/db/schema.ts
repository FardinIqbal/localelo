import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  real,
  uuid,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const membershipStatusEnum = pgEnum("membership_status", [
  "pending",
  "approved",
  "banned",
]);

export const organizationVisibilityEnum = pgEnum("organization_visibility", [
  "public",
  "private",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "active",
  "invalidated",
]);

export const leagueTierEnum = pgEnum("league_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "champion",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
  "completed",
]);

export const achievementTypeEnum = pgEnum("achievement_type", [
  "first_win",
  "first_match",
  "win_streak_3",
  "win_streak_5",
  "win_streak_10",
  "upset_win",
  "rating_1600",
  "rating_1800",
  "rating_2000",
  "matches_10",
  "matches_50",
  "matches_100",
  "activity_streak_7",
  "activity_streak_30",
  "activity_streak_100",
  "tier_silver",
  "tier_gold",
  "tier_platinum",
  "tier_diamond",
  "tier_champion",
  "league_winner",
]);

// Users (synced with Clerk)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations (gyms, clubs, teams)
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    location: text("location"),
    website: text("website"),
    imageUrl: text("image_url"),
    visibility: organizationVisibilityEnum("visibility")
      .default("public")
      .notNull(),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("organizations_slug_idx").on(table.slug)]
);

// Organization Memberships
export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    username: text("username").notNull(),
    status: membershipStatusEnum("status").default("pending").notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    isOwner: boolean("is_owner").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("org_user_unique").on(table.organizationId, table.userId),
    unique("org_username_unique").on(table.organizationId, table.username),
    index("memberships_org_idx").on(table.organizationId),
    index("memberships_user_idx").on(table.userId),
  ]
);

// Leaderboards (ranking ladders within an organization)
export const leaderboards = pgTable(
  "leaderboards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sport: text("sport"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("leaderboards_org_idx").on(table.organizationId)]
);

// Leaderboard Ratings (user's Elo/rating for a specific leaderboard)
export const leaderboardRatings = pgTable(
  "leaderboard_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leaderboardId: uuid("leaderboard_id")
      .references(() => leaderboards.id, { onDelete: "cascade" })
      .notNull(),
    membershipId: uuid("membership_id")
      .references(() => organizationMemberships.id, { onDelete: "cascade" })
      .notNull(),
    rating: real("rating").default(1500).notNull(),
    ratingDeviation: real("rating_deviation").default(350).notNull(),
    volatility: real("volatility").default(0.06).notNull(),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    draws: integer("draws").default(0).notNull(),
    lastRatedAt: timestamp("last_rated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("rating_leaderboard_member_unique").on(
      table.leaderboardId,
      table.membershipId
    ),
    index("ratings_leaderboard_idx").on(table.leaderboardId),
    index("ratings_membership_idx").on(table.membershipId),
    index("ratings_leaderboard_rating_idx").on(table.leaderboardId, table.rating),
  ]
);

// Matches
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leaderboardId: uuid("leaderboard_id")
      .references(() => leaderboards.id, { onDelete: "cascade" })
      .notNull(),
    winnerMembershipId: uuid("winner_membership_id").references(
      () => organizationMemberships.id
    ),
    isDraw: boolean("is_draw").default(false).notNull(),
    status: matchStatusEnum("status").default("active").notNull(),
    matchTime: timestamp("match_time").defaultNow().notNull(),
    ratedAt: timestamp("rated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("matches_leaderboard_idx").on(table.leaderboardId),
    index("matches_time_idx").on(table.matchTime),
    index("matches_status_idx").on(table.status),
  ]
);

// Match Participants
export const matchParticipants = pgTable(
  "match_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    membershipId: uuid("membership_id")
      .references(() => organizationMemberships.id, { onDelete: "cascade" })
      .notNull(),
    isWinner: boolean("is_winner").default(false).notNull(),
    ratingBefore: real("rating_before"),
    ratingAfter: real("rating_after"),
    ratingDeviationBefore: real("rating_deviation_before"),
    ratingDeviationAfter: real("rating_deviation_after"),
    volatilityBefore: real("volatility_before"),
    volatilityAfter: real("volatility_after"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("participant_match_member_unique").on(table.matchId, table.membershipId),
    index("participants_match_idx").on(table.matchId),
    index("participants_membership_idx").on(table.membershipId),
  ]
);

// Rating History (for charts and analytics)
export const ratingHistory = pgTable(
  "rating_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .references(() => organizationMemberships.id, { onDelete: "cascade" })
      .notNull(),
    leaderboardId: uuid("leaderboard_id")
      .references(() => leaderboards.id, { onDelete: "cascade" })
      .notNull(),
    matchId: uuid("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    rating: real("rating").notNull(),
    ratingDeviation: real("rating_deviation").notNull(),
    volatility: real("volatility").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("history_membership_idx").on(table.membershipId),
    index("history_leaderboard_idx").on(table.leaderboardId),
    index("history_match_idx").on(table.matchId),
  ]
);

// ============= GAMIFICATION TABLES =============

// Recent Opponents (for quick match logging)
export const recentOpponents = pgTable(
  "recent_opponents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .references(() => organizationMemberships.id, { onDelete: "cascade" })
      .notNull(),
    opponentMembershipId: uuid("opponent_membership_id")
      .references(() => organizationMemberships.id, { onDelete: "cascade" })
      .notNull(),
    leaderboardId: uuid("leaderboard_id")
      .references(() => leaderboards.id, { onDelete: "cascade" })
      .notNull(),
    matchCount: integer("match_count").default(1).notNull(),
    lastPlayedAt: timestamp("last_played_at").defaultNow().notNull(),
  },
  (table) => [
    unique("recent_opponent_unique").on(
      table.membershipId,
      table.opponentMembershipId,
      table.leaderboardId
    ),
    index("recent_opponents_member_idx").on(table.membershipId),
    index("recent_opponents_leaderboard_idx").on(table.leaderboardId),
  ]
);

// User Streaks (activity tracking)
export const userStreaks = pgTable(
  "user_streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastActivityDate: timestamp("last_activity_date"),
    freezesAvailable: integer("freezes_available").default(0).notNull(),
    weekendAmuletActive: boolean("weekend_amulet_active").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("streaks_user_idx").on(table.userId)]
);

// Daily Activity (for streak calculation and XP tracking)
export const dailyActivity = pgTable(
  "daily_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    activityDate: timestamp("activity_date").notNull(),
    matchesPlayed: integer("matches_played").default(0).notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("daily_activity_unique").on(table.userId, table.activityDate),
    index("daily_activity_user_idx").on(table.userId),
    index("daily_activity_date_idx").on(table.activityDate),
  ]
);

// Weekly Leagues
export const weeklyLeagues = pgTable(
  "weekly_leagues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tier: leagueTierEnum("tier").notNull(),
    weekStart: timestamp("week_start").notNull(),
    weekEnd: timestamp("week_end").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("leagues_tier_idx").on(table.tier),
    index("leagues_week_idx").on(table.weekStart),
  ]
);

// League Memberships (user's participation in weekly leagues)
export const leagueMemberships = pgTable(
  "league_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .references(() => weeklyLeagues.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weeklyXp: integer("weekly_xp").default(0).notNull(),
    finalRank: integer("final_rank"),
    promoted: boolean("promoted").default(false).notNull(),
    demoted: boolean("demoted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("league_membership_unique").on(table.leagueId, table.userId),
    index("league_memberships_league_idx").on(table.leagueId),
    index("league_memberships_user_idx").on(table.userId),
    index("league_memberships_xp_idx").on(table.weeklyXp),
  ]
);

// User XP (lifetime XP and current tier)
export const userXp = pgTable(
  "user_xp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    totalXp: integer("total_xp").default(0).notNull(),
    weeklyXp: integer("weekly_xp").default(0).notNull(),
    currentTier: leagueTierEnum("current_tier").default("bronze").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_xp_user_idx").on(table.userId),
    index("user_xp_tier_idx").on(table.currentTier),
  ]
);

// User Achievements
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    achievementType: achievementTypeEnum("achievement_type").notNull(),
    achievedAt: timestamp("achieved_at").defaultNow().notNull(),
    metadata: text("metadata"), // JSON string for extra data
  },
  (table) => [
    unique("user_achievement_unique").on(table.userId, table.achievementType),
    index("achievements_user_idx").on(table.userId),
    index("achievements_type_idx").on(table.achievementType),
  ]
);

// Challenges (player vs player challenges)
export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengerMembershipId: uuid("challenger_membership_id")
      .references(() => leaderboardRatings.id, { onDelete: "cascade" })
      .notNull(),
    challengedMembershipId: uuid("challenged_membership_id")
      .references(() => leaderboardRatings.id, { onDelete: "cascade" })
      .notNull(),
    leaderboardId: uuid("leaderboard_id")
      .references(() => leaderboards.id, { onDelete: "cascade" })
      .notNull(),
    status: challengeStatusEnum("status").default("pending").notNull(),
    message: text("message"),
    matchId: uuid("match_id").references(() => matches.id),
    expiresAt: timestamp("expires_at").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("challenges_challenger_idx").on(table.challengerMembershipId),
    index("challenges_challenged_idx").on(table.challengedMembershipId),
    index("challenges_leaderboard_idx").on(table.leaderboardId),
    index("challenges_status_idx").on(table.status),
  ]
);

// Push Subscriptions (for web push notifications)
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("push_subscriptions_user_idx").on(table.userId),
    unique("push_subscriptions_endpoint_unique").on(table.endpoint),
  ]
);

// Notification Preferences
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    streakReminders: boolean("streak_reminders").default(true).notNull(),
    rankChanges: boolean("rank_changes").default(true).notNull(),
    challengeAlerts: boolean("challenge_alerts").default(true).notNull(),
    leagueResults: boolean("league_results").default(true).notNull(),
    reminderTime: text("reminder_time").default("18:00"), // HH:MM format
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("notification_prefs_user_idx").on(table.userId)]
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  memberships: many(organizationMemberships),
  createdOrganizations: many(organizations),
  streak: one(userStreaks),
  xp: one(userXp),
  dailyActivities: many(dailyActivity),
  achievements: many(userAchievements),
  leagueMemberships: many(leagueMemberships),
  pushSubscriptions: many(pushSubscriptions),
  notificationPreferences: one(notificationPreferences),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [organizations.createdById],
    references: [users.id],
  }),
  memberships: many(organizationMemberships),
  leaderboards: many(leaderboards),
}));

export const organizationMembershipsRelations = relations(
  organizationMemberships,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [organizationMemberships.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
    ratings: many(leaderboardRatings),
    matchParticipations: many(matchParticipants),
    ratingHistory: many(ratingHistory),
  })
);

export const leaderboardsRelations = relations(leaderboards, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leaderboards.organizationId],
    references: [organizations.id],
  }),
  ratings: many(leaderboardRatings),
  matches: many(matches),
  ratingHistory: many(ratingHistory),
}));

export const leaderboardRatingsRelations = relations(leaderboardRatings, ({ one }) => ({
  leaderboard: one(leaderboards, {
    fields: [leaderboardRatings.leaderboardId],
    references: [leaderboards.id],
  }),
  membership: one(organizationMemberships, {
    fields: [leaderboardRatings.membershipId],
    references: [organizationMemberships.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  leaderboard: one(leaderboards, {
    fields: [matches.leaderboardId],
    references: [leaderboards.id],
  }),
  winner: one(organizationMemberships, {
    fields: [matches.winnerMembershipId],
    references: [organizationMemberships.id],
  }),
  participants: many(matchParticipants),
  ratingHistory: many(ratingHistory),
}));

export const matchParticipantsRelations = relations(matchParticipants, ({ one }) => ({
  match: one(matches, {
    fields: [matchParticipants.matchId],
    references: [matches.id],
  }),
  membership: one(organizationMemberships, {
    fields: [matchParticipants.membershipId],
    references: [organizationMemberships.id],
  }),
}));

export const ratingHistoryRelations = relations(ratingHistory, ({ one }) => ({
  membership: one(organizationMemberships, {
    fields: [ratingHistory.membershipId],
    references: [organizationMemberships.id],
  }),
  leaderboard: one(leaderboards, {
    fields: [ratingHistory.leaderboardId],
    references: [leaderboards.id],
  }),
  match: one(matches, {
    fields: [ratingHistory.matchId],
    references: [matches.id],
  }),
}));

// Gamification relations
export const recentOpponentsRelations = relations(recentOpponents, ({ one }) => ({
  membership: one(organizationMemberships, {
    fields: [recentOpponents.membershipId],
    references: [organizationMemberships.id],
  }),
  opponent: one(organizationMemberships, {
    fields: [recentOpponents.opponentMembershipId],
    references: [organizationMemberships.id],
  }),
  leaderboard: one(leaderboards, {
    fields: [recentOpponents.leaderboardId],
    references: [leaderboards.id],
  }),
}));

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id],
  }),
}));

export const dailyActivityRelations = relations(dailyActivity, ({ one }) => ({
  user: one(users, {
    fields: [dailyActivity.userId],
    references: [users.id],
  }),
}));

export const weeklyLeaguesRelations = relations(weeklyLeagues, ({ many }) => ({
  memberships: many(leagueMemberships),
}));

export const leagueMembershipsRelations = relations(leagueMemberships, ({ one }) => ({
  league: one(weeklyLeagues, {
    fields: [leagueMemberships.leagueId],
    references: [weeklyLeagues.id],
  }),
  user: one(users, {
    fields: [leagueMemberships.userId],
    references: [users.id],
  }),
}));

export const userXpRelations = relations(userXp, ({ one }) => ({
  user: one(users, {
    fields: [userXp.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one }) => ({
  challenger: one(organizationMemberships, {
    fields: [challenges.challengerMembershipId],
    references: [organizationMemberships.id],
  }),
  challenged: one(organizationMemberships, {
    fields: [challenges.challengedMembershipId],
    references: [organizationMemberships.id],
  }),
  leaderboard: one(leaderboards, {
    fields: [challenges.leaderboardId],
    references: [leaderboards.id],
  }),
  match: one(matches, {
    fields: [challenges.matchId],
    references: [matches.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership = typeof organizationMemberships.$inferInsert;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type NewLeaderboard = typeof leaderboards.$inferInsert;
export type LeaderboardRating = typeof leaderboardRatings.$inferSelect;
export type NewLeaderboardRating = typeof leaderboardRatings.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type MatchParticipant = typeof matchParticipants.$inferSelect;
export type NewMatchParticipant = typeof matchParticipants.$inferInsert;
export type RatingHistory = typeof ratingHistory.$inferSelect;
export type NewRatingHistory = typeof ratingHistory.$inferInsert;
export type RecentOpponent = typeof recentOpponents.$inferSelect;
export type NewRecentOpponent = typeof recentOpponents.$inferInsert;
export type UserStreak = typeof userStreaks.$inferSelect;
export type NewUserStreak = typeof userStreaks.$inferInsert;
export type DailyActivity = typeof dailyActivity.$inferSelect;
export type NewDailyActivity = typeof dailyActivity.$inferInsert;
export type WeeklyLeague = typeof weeklyLeagues.$inferSelect;
export type NewWeeklyLeague = typeof weeklyLeagues.$inferInsert;
export type LeagueMembership = typeof leagueMemberships.$inferSelect;
export type NewLeagueMembership = typeof leagueMemberships.$inferInsert;
export type UserXp = typeof userXp.$inferSelect;
export type NewUserXp = typeof userXp.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
