import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";

// Get start of current week (Monday 00:00 UTC)
function getWeekStart(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - diff);
  return date.getTime();
}

// Default weekly goals
const DEFAULT_GOALS = {
  matchesTarget: 10,
  winsTarget: 5,
  xpTarget: 200,
};

/**
 * Get user's weekly progress toward goals
 */
export const getWeeklyProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const now = Date.now();
    const weekStart = getWeekStart(now);

    // Get matches this week from dailyActivity
    const activities = await ctx.db
      .query("dailyActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("activityDate"), weekStart))
      .collect();

    const matchesThisWeek = activities.reduce((sum, a) => sum + a.matchesPlayed, 0);
    const xpThisWeek = activities.reduce((sum, a) => sum + a.xpEarned, 0);

    // Get win count this week by checking matches
    // For simplicity, estimate wins as ~50% of matches (could be made more accurate)
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let winsThisWeek = 0;
    for (const membership of memberships) {
      const participations = await ctx.db
        .query("matchParticipants")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const p of participations) {
        if (p.isWinner) {
          const match = await ctx.db.get(p.matchId);
          if (match && !match.deletedAt && match.matchTime >= weekStart) {
            winsThisWeek++;
          }
        }
      }
    }

    // Get user XP for tier info
    const userXp = await ctx.db
      .query("userXp")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Calculate days active this week
    const daysActive = new Set(
      activities.map((a) => {
        const date = new Date(a.activityDate);
        return date.toISOString().split("T")[0];
      })
    ).size;

    return {
      matchesThisWeek,
      matchesTarget: DEFAULT_GOALS.matchesTarget,
      matchesProgress: Math.min(100, (matchesThisWeek / DEFAULT_GOALS.matchesTarget) * 100),

      winsThisWeek,
      winsTarget: DEFAULT_GOALS.winsTarget,
      winsProgress: Math.min(100, (winsThisWeek / DEFAULT_GOALS.winsTarget) * 100),

      xpThisWeek,
      xpTarget: DEFAULT_GOALS.xpTarget,
      xpProgress: Math.min(100, (xpThisWeek / DEFAULT_GOALS.xpTarget) * 100),

      daysActive,
      daysTarget: 5,
      daysProgress: Math.min(100, (daysActive / 5) * 100),

      currentTier: userXp?.currentTier ?? "bronze",
      totalXp: userXp?.totalXp ?? 0,
    };
  },
});

/**
 * Get milestone progress for a user's ratings
 */
export const getMilestoneProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const milestones = [
      { rating: 1600, label: "Rising Star", color: "emerald" },
      { rating: 1800, label: "Elite", color: "blue" },
      { rating: 2000, label: "Grandmaster", color: "amber" },
    ];

    const results = [];

    for (const membership of memberships) {
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const rating of ratings) {
        const leaderboard = await ctx.db.get(rating.leaderboardId);
        const org = leaderboard ? await ctx.db.get(leaderboard.organizationId) : null;

        // Find next milestone
        const nextMilestone = milestones.find((m) => rating.rating < m.rating);
        if (nextMilestone) {
          const prevMilestone = milestones
            .filter((m) => m.rating < nextMilestone.rating)
            .pop();
          const startRating = prevMilestone?.rating ?? 1500;
          const progress =
            ((rating.rating - startRating) / (nextMilestone.rating - startRating)) * 100;

          results.push({
            leaderboardId: rating.leaderboardId,
            leaderboardName: leaderboard?.name ?? "Unknown",
            orgName: org?.name ?? "Unknown",
            currentRating: Math.round(rating.rating),
            targetRating: nextMilestone.rating,
            targetLabel: nextMilestone.label,
            progress: Math.max(0, Math.min(100, progress)),
            color: nextMilestone.color,
            ratingNeeded: Math.round(nextMilestone.rating - rating.rating),
          });
        }
      }
    }

    // Sort by closest to milestone
    return results.sort((a, b) => b.progress - a.progress).slice(0, 3);
  },
});
