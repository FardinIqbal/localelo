import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";

// Get start of day in UTC
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

// Check if two timestamps are on the same day
function isSameDay(ts1: number, ts2: number): boolean {
  return getStartOfDay(ts1) === getStartOfDay(ts2);
}

// Check if ts1 is exactly one day before ts2
function isConsecutiveDay(ts1: number, ts2: number): boolean {
  const day1 = getStartOfDay(ts1);
  const day2 = getStartOfDay(ts2);
  const oneDayMs = 24 * 60 * 60 * 1000;
  return day2 - day1 === oneDayMs;
}

/**
 * Get current user's streak data
 */
export const getMyStreak = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const streak = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezesAvailable: 1,
        isActiveToday: false,
        streakAtRisk: false,
      };
    }

    const now = Date.now();
    const today = getStartOfDay(now);
    const lastActivity = streak.lastActivityDate ?? 0;
    const lastActivityDay = getStartOfDay(lastActivity);

    const isActiveToday = isSameDay(now, lastActivity);
    const wasActiveYesterday = isConsecutiveDay(lastActivity, now);
    const streakAtRisk = !isActiveToday && wasActiveYesterday;

    // Check if streak is broken (more than 1 day gap)
    const daysSinceActivity = Math.floor((today - lastActivityDay) / (24 * 60 * 60 * 1000));
    const streakBroken = daysSinceActivity > 1;

    return {
      currentStreak: streakBroken ? 0 : streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      freezesAvailable: streak.freezesAvailable,
      isActiveToday,
      streakAtRisk,
    };
  },
});

/**
 * Record activity for today (called when logging a match)
 */
export const recordActivity = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const today = getStartOfDay(now);

    // Get or create streak record
    let streak = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!streak) {
      // Create new streak record
      await ctx.db.insert("userStreaks", {
        userId: user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
        freezesAvailable: 1,
        weekendAmuletActive: false,
      });

      // Log daily activity
      await ctx.db.insert("dailyActivity", {
        userId: user._id,
        activityDate: today,
        matchesPlayed: 1,
        xpEarned: 10,
      });

      return { currentStreak: 1, isNewStreak: true };
    }

    const lastActivity = streak.lastActivityDate ?? 0;
    const lastActivityDay = getStartOfDay(lastActivity);

    // Already active today - just update activity log
    if (isSameDay(now, lastActivity)) {
      const todayActivity = await ctx.db
        .query("dailyActivity")
        .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("activityDate", today))
        .unique();

      if (todayActivity) {
        await ctx.db.patch(todayActivity._id, {
          matchesPlayed: todayActivity.matchesPlayed + 1,
          xpEarned: todayActivity.xpEarned + 10,
        });
      }

      return { currentStreak: streak.currentStreak, isNewStreak: false };
    }

    // Check if consecutive day
    const isConsecutive = isConsecutiveDay(lastActivity, now);
    const daysSinceActivity = Math.floor((today - lastActivityDay) / (24 * 60 * 60 * 1000));

    let newStreak = streak.currentStreak;

    if (isConsecutive) {
      // Continue streak
      newStreak = streak.currentStreak + 1;
    } else if (daysSinceActivity > 1) {
      // Streak broken - start fresh
      newStreak = 1;
    }

    const newLongest = Math.max(streak.longestStreak, newStreak);

    await ctx.db.patch(streak._id, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: now,
    });

    // Log daily activity
    await ctx.db.insert("dailyActivity", {
      userId: user._id,
      activityDate: today,
      matchesPlayed: 1,
      xpEarned: 10,
    });

    return { currentStreak: newStreak, isNewStreak: isConsecutive };
  },
});

/**
 * Use a streak freeze to preserve streak
 */
export const useFreeze = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const streak = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!streak) {
      throw new Error("No streak record found");
    }

    if (streak.freezesAvailable <= 0) {
      throw new Error("No freezes available");
    }

    const now = Date.now();

    await ctx.db.patch(streak._id, {
      freezesAvailable: streak.freezesAvailable - 1,
      lastActivityDate: now, // Treat freeze as activity
    });

    return { freezesRemaining: streak.freezesAvailable - 1 };
  },
});

/**
 * Get streak leaderboard (top streaks in an org)
 */
export const getStreakLeaderboard = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all members of the org
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const streakData = [];

    for (const membership of memberships) {
      const streak = await ctx.db
        .query("userStreaks")
        .withIndex("by_user", (q) => q.eq("userId", membership.userId))
        .unique();

      if (streak && streak.currentStreak > 0) {
        streakData.push({
          membershipId: membership._id,
          username: membership.username,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
        });
      }
    }

    // Sort by current streak descending
    return streakData
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, limit);
  },
});
