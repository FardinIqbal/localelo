import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";
import { Id } from "./_generated/dataModel";

// Tier thresholds and XP requirements
const TIER_ORDER = ["bronze", "silver", "gold", "platinum", "diamond", "champion"] as const;
type Tier = (typeof TIER_ORDER)[number];

const TIER_XP_THRESHOLD: Record<Tier, number> = {
  bronze: 0,
  silver: 100,
  gold: 300,
  platinum: 600,
  diamond: 1000,
  champion: 2000,
};

// XP rewards
const XP_REWARDS = {
  WIN: 25,
  LOSS: 10,
  DRAW: 15,
  DAILY_BONUS: 5, // First match of the day
  STREAK_BONUS: 2, // Per streak day
};

// Get start of current week (Monday 00:00 UTC)
function getWeekStart(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Adjust to Monday
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - diff);
  return date.getTime();
}

// Get end of current week (Sunday 23:59:59 UTC)
function getWeekEnd(timestamp: number): number {
  const weekStart = getWeekStart(timestamp);
  return weekStart + 7 * 24 * 60 * 60 * 1000 - 1;
}

// Get time remaining in week
function getTimeRemaining(weekEnd: number): { days: number; hours: number } {
  const now = Date.now();
  const remaining = Math.max(0, weekEnd - now);
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return { days, hours };
}

/**
 * Get current user's league status
 */
export const getMyLeagueStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    // Get or create user XP record
    let userXp = await ctx.db
      .query("userXp")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);

    if (!userXp) {
      return {
        tier: "bronze" as Tier,
        weeklyXp: 0,
        totalXp: 0,
        rank: null,
        totalInTier: 0,
        xpToNextTier: TIER_XP_THRESHOLD.silver,
        timeRemaining: getTimeRemaining(weekEnd),
        weekStart,
        weekEnd,
      };
    }

    // Get current week's league for user's tier
    const league = await ctx.db
      .query("weeklyLeagues")
      .withIndex("by_week", (q) => q.eq("weekStart", weekStart))
      .filter((q) => q.eq(q.field("tier"), userXp!.currentTier))
      .unique();

    let rank = null;
    let totalInTier = 0;

    if (league) {
      // Count users with more XP in same league
      const memberships = await ctx.db
        .query("leagueMemberships")
        .withIndex("by_league", (q) => q.eq("leagueId", league._id))
        .collect();

      totalInTier = memberships.length;
      const userMembership = memberships.find((m) => m.userId === user._id);
      if (userMembership) {
        rank = memberships.filter((m) => m.weeklyXp > userMembership.weeklyXp).length + 1;
      }
    }

    // Calculate XP to next tier
    const currentTierIndex = TIER_ORDER.indexOf(userXp.currentTier);
    const nextTier = TIER_ORDER[currentTierIndex + 1];
    const xpToNextTier = nextTier ? TIER_XP_THRESHOLD[nextTier] - userXp.totalXp : 0;

    return {
      tier: userXp.currentTier,
      weeklyXp: userXp.weeklyXp,
      totalXp: userXp.totalXp,
      rank,
      totalInTier,
      xpToNextTier: Math.max(0, xpToNextTier),
      timeRemaining: getTimeRemaining(weekEnd),
      weekStart,
      weekEnd,
    };
  },
});

/**
 * Get weekly leaderboard for user's tier
 */
export const getWeeklyLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const limit = args.limit ?? 10;
    const now = Date.now();
    const weekStart = getWeekStart(now);

    // Get user's tier
    const userXp = await ctx.db
      .query("userXp")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const tier = userXp?.currentTier ?? "bronze";

    // Get this week's league
    const league = await ctx.db
      .query("weeklyLeagues")
      .withIndex("by_week", (q) => q.eq("weekStart", weekStart))
      .filter((q) => q.eq(q.field("tier"), tier))
      .unique();

    if (!league) {
      return { tier, rankings: [], userRank: null };
    }

    // Get all memberships sorted by XP
    const memberships = await ctx.db
      .query("leagueMemberships")
      .withIndex("by_league", (q) => q.eq("leagueId", league._id))
      .collect();

    // Sort by weekly XP descending
    memberships.sort((a, b) => b.weeklyXp - a.weeklyXp);

    // Get user info for each membership
    const rankings = [];
    let userRank = null;

    for (let i = 0; i < memberships.length; i++) {
      const membership = memberships[i];
      const memberUser = await ctx.db.get(membership.userId);

      if (membership.userId === user._id) {
        userRank = i + 1;
      }

      if (i < limit) {
        rankings.push({
          rank: i + 1,
          userId: membership.userId,
          name: memberUser?.firstName || "Anonymous",
          imageUrl: memberUser?.imageUrl,
          weeklyXp: membership.weeklyXp,
          isCurrentUser: membership.userId === user._id,
        });
      }
    }

    return { tier, rankings, userRank, totalParticipants: memberships.length };
  },
});

/**
 * Award XP for match activity (called from matches.ts)
 */
export const awardMatchXp = mutation({
  args: {
    userId: v.id("users"),
    isWin: v.boolean(),
    isDraw: v.boolean(),
    isFirstMatchToday: v.boolean(),
    streakDays: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, isWin, isDraw, isFirstMatchToday, streakDays } = args;
    const now = Date.now();
    const weekStart = getWeekStart(now);

    // Calculate XP
    let xpEarned = isDraw ? XP_REWARDS.DRAW : isWin ? XP_REWARDS.WIN : XP_REWARDS.LOSS;

    if (isFirstMatchToday) {
      xpEarned += XP_REWARDS.DAILY_BONUS;
    }

    xpEarned += streakDays * XP_REWARDS.STREAK_BONUS;

    // Get or create user XP record
    let userXp = await ctx.db
      .query("userXp")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userXp) {
      const newUserXpId = await ctx.db.insert("userXp", {
        userId,
        totalXp: xpEarned,
        weeklyXp: xpEarned,
        currentTier: "bronze",
      });
      userXp = await ctx.db.get(newUserXpId);
    } else {
      const newTotalXp = userXp.totalXp + xpEarned;
      const newWeeklyXp = userXp.weeklyXp + xpEarned;

      // Check for tier promotion
      let newTier = userXp.currentTier;
      for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
        if (newTotalXp >= TIER_XP_THRESHOLD[TIER_ORDER[i]]) {
          newTier = TIER_ORDER[i];
          break;
        }
      }

      await ctx.db.patch(userXp._id, {
        totalXp: newTotalXp,
        weeklyXp: newWeeklyXp,
        currentTier: newTier,
      });
    }

    // Ensure user is in a league this week
    await ensureLeagueMembership(ctx, userId, userXp?.currentTier ?? "bronze", weekStart, xpEarned);

    return { xpEarned };
  },
});

// Helper to ensure user is in a league
async function ensureLeagueMembership(
  ctx: any,
  userId: Id<"users">,
  tier: Tier,
  weekStart: number,
  xpToAdd: number
) {
  const weekEnd = getWeekEnd(weekStart);

  // Get or create league for this tier/week
  let league = await ctx.db
    .query("weeklyLeagues")
    .withIndex("by_week", (q: any) => q.eq("weekStart", weekStart))
    .filter((q: any) => q.eq(q.field("tier"), tier))
    .unique();

  if (!league) {
    const leagueId = await ctx.db.insert("weeklyLeagues", {
      tier,
      weekStart,
      weekEnd,
    });
    league = await ctx.db.get(leagueId);
  }

  // Get or create membership
  const existingMembership = await ctx.db
    .query("leagueMemberships")
    .withIndex("by_league", (q: any) => q.eq("leagueId", league._id))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .unique();

  if (existingMembership) {
    await ctx.db.patch(existingMembership._id, {
      weeklyXp: existingMembership.weeklyXp + xpToAdd,
    });
  } else {
    await ctx.db.insert("leagueMemberships", {
      leagueId: league._id,
      userId,
      weeklyXp: xpToAdd,
      promoted: false,
      demoted: false,
    });
  }
}

/**
 * Get tier info (thresholds, colors, etc.)
 */
export const getTierInfo = query({
  args: {},
  handler: async () => {
    return {
      tiers: TIER_ORDER,
      thresholds: TIER_XP_THRESHOLD,
      colors: {
        bronze: { bg: "bg-amber-900/20", text: "text-amber-600", border: "border-amber-700/30" },
        silver: { bg: "bg-zinc-400/20", text: "text-zinc-300", border: "border-zinc-500/30" },
        gold: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
        platinum: { bg: "bg-cyan-400/20", text: "text-cyan-300", border: "border-cyan-400/30" },
        diamond: { bg: "bg-blue-400/20", text: "text-blue-300", border: "border-blue-400/30" },
        champion: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-400/30" },
      },
    };
  },
});

/**
 * Reset weekly XP (called by cron job Monday 00:00)
 */
export const weeklyReset = mutation({
  args: {},
  handler: async (ctx) => {
    // Reset all users' weekly XP
    const allUserXp = await ctx.db.query("userXp").collect();

    for (const userXp of allUserXp) {
      await ctx.db.patch(userXp._id, {
        weeklyXp: 0,
      });
    }

    // Process promotions/demotions from last week could go here
    // For now just reset

    return { usersReset: allUserXp.length };
  },
});
