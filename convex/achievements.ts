import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";
import { Id } from "./_generated/dataModel";

// Achievement definitions
export const ACHIEVEMENTS = {
  // Milestone achievements
  first_match: {
    id: "first_match",
    name: "First Blood",
    description: "Log your first match",
    icon: "Swords",
    rarity: "common",
  },
  first_win: {
    id: "first_win",
    name: "Taste of Victory",
    description: "Win your first match",
    icon: "Trophy",
    rarity: "common",
  },
  ten_matches: {
    id: "ten_matches",
    name: "Getting Started",
    description: "Play 10 matches",
    icon: "Target",
    rarity: "common",
  },
  fifty_matches: {
    id: "fifty_matches",
    name: "Dedicated",
    description: "Play 50 matches",
    icon: "Medal",
    rarity: "uncommon",
  },
  hundred_matches: {
    id: "hundred_matches",
    name: "Veteran",
    description: "Play 100 matches",
    icon: "Award",
    rarity: "rare",
  },

  // Streak achievements
  streak_3: {
    id: "streak_3",
    name: "On Fire",
    description: "Win 3 matches in a row",
    icon: "Flame",
    rarity: "common",
  },
  streak_5: {
    id: "streak_5",
    name: "Unstoppable",
    description: "Win 5 matches in a row",
    icon: "Flame",
    rarity: "uncommon",
  },
  streak_10: {
    id: "streak_10",
    name: "Legendary",
    description: "Win 10 matches in a row",
    icon: "Crown",
    rarity: "rare",
  },

  // Daily streak achievements
  daily_streak_7: {
    id: "daily_streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day activity streak",
    icon: "Calendar",
    rarity: "uncommon",
  },
  daily_streak_30: {
    id: "daily_streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day activity streak",
    icon: "Calendar",
    rarity: "rare",
  },

  // Rating achievements
  rating_1600: {
    id: "rating_1600",
    name: "Rising Star",
    description: "Reach 1600 rating",
    icon: "Star",
    rarity: "uncommon",
  },
  rating_1800: {
    id: "rating_1800",
    name: "Elite",
    description: "Reach 1800 rating",
    icon: "Star",
    rarity: "rare",
  },
  rating_2000: {
    id: "rating_2000",
    name: "Grandmaster",
    description: "Reach 2000 rating",
    icon: "Crown",
    rarity: "legendary",
  },

  // Rank achievements
  rank_top_10: {
    id: "rank_top_10",
    name: "Top 10",
    description: "Reach top 10 on any leaderboard",
    icon: "TrendingUp",
    rarity: "uncommon",
  },
  rank_top_3: {
    id: "rank_top_3",
    name: "Podium",
    description: "Reach top 3 on any leaderboard",
    icon: "Medal",
    rarity: "rare",
  },
  rank_1: {
    id: "rank_1",
    name: "Champion",
    description: "Reach #1 on any leaderboard",
    icon: "Crown",
    rarity: "legendary",
  },

  // Social achievements
  rivalry_10: {
    id: "rivalry_10",
    name: "Nemesis",
    description: "Play 10 matches against the same opponent",
    icon: "Users",
    rarity: "uncommon",
  },

  // Comeback achievements
  comeback: {
    id: "comeback",
    name: "Comeback King",
    description: "Win a match after losing 3 in a row",
    icon: "Repeat",
    rarity: "uncommon",
  },

  // Upset achievements
  upset: {
    id: "upset",
    name: "Giant Slayer",
    description: "Beat an opponent rated 200+ higher",
    icon: "Zap",
    rarity: "rare",
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

const RARITY_ORDER = ["common", "uncommon", "rare", "legendary"] as const;

/**
 * Get user's achievements
 */
export const getMyAchievements = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return { achievements: [], recentUnlocks: [] };

    const achievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Map to full achievement data
    const mapped = achievements.map((a) => {
      const def = ACHIEVEMENTS[a.achievementType as AchievementId];
      return {
        ...def,
        achievedAt: a.achievedAt,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
      };
    });

    // Sort by rarity (legendary first) then by date
    mapped.sort((a, b) => {
      const rarityA = RARITY_ORDER.indexOf(a.rarity as any);
      const rarityB = RARITY_ORDER.indexOf(b.rarity as any);
      if (rarityA !== rarityB) return rarityB - rarityA;
      return b.achievedAt - a.achievedAt;
    });

    // Get recent unlocks (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUnlocks = mapped.filter((a) => a.achievedAt > weekAgo);

    return { achievements: mapped, recentUnlocks };
  },
});

/**
 * Get all available achievements with unlock status
 */
export const getAllAchievements = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const unlockedIds = new Set(userAchievements.map((a) => a.achievementType));

    return Object.values(ACHIEVEMENTS).map((def) => ({
      ...def,
      unlocked: unlockedIds.has(def.id),
      achievedAt: userAchievements.find((a) => a.achievementType === def.id)?.achievedAt,
    }));
  },
});

/**
 * Check and award achievements after a match
 * Returns array of newly unlocked achievements
 */
export const checkMatchAchievements = mutation({
  args: {
    userId: v.id("users"),
    isWin: v.boolean(),
    ratingChange: v.number(),
    newRating: v.number(),
    opponentRating: v.number(),
    totalWins: v.number(),
    totalLosses: v.number(),
    currentWinStreak: v.number(),
    currentDailyStreak: v.number(),
    rank: v.optional(v.number()),
    matchCount: v.number(),
    opponentMatchCount: v.number(),
  },
  handler: async (ctx, args) => {
    const newAchievements: AchievementId[] = [];
    const totalMatches = args.totalWins + args.totalLosses;

    // Helper to check if achievement exists
    const hasAchievement = async (type: string) => {
      const existing = await ctx.db
        .query("userAchievements")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("achievementType"), type))
        .unique();
      return !!existing;
    };

    // Helper to award achievement
    const award = async (type: AchievementId, metadata?: object) => {
      if (await hasAchievement(type)) return false;
      await ctx.db.insert("userAchievements", {
        userId: args.userId,
        achievementType: type,
        achievedAt: Date.now(),
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      });
      newAchievements.push(type);
      return true;
    };

    // First match
    if (totalMatches === 1) {
      await award("first_match");
    }

    // First win
    if (args.isWin && args.totalWins === 1) {
      await award("first_win");
    }

    // Match count milestones
    if (totalMatches >= 10) await award("ten_matches");
    if (totalMatches >= 50) await award("fifty_matches");
    if (totalMatches >= 100) await award("hundred_matches");

    // Win streak achievements
    if (args.currentWinStreak >= 3) await award("streak_3");
    if (args.currentWinStreak >= 5) await award("streak_5");
    if (args.currentWinStreak >= 10) await award("streak_10");

    // Daily streak achievements
    if (args.currentDailyStreak >= 7) await award("daily_streak_7");
    if (args.currentDailyStreak >= 30) await award("daily_streak_30");

    // Rating achievements
    if (args.newRating >= 1600) await award("rating_1600");
    if (args.newRating >= 1800) await award("rating_1800");
    if (args.newRating >= 2000) await award("rating_2000");

    // Rank achievements
    if (args.rank !== undefined) {
      if (args.rank <= 10) await award("rank_top_10");
      if (args.rank <= 3) await award("rank_top_3");
      if (args.rank === 1) await award("rank_1");
    }

    // Rivalry achievement (10 matches vs same opponent)
    if (args.opponentMatchCount >= 10) {
      await award("rivalry_10");
    }

    // Upset achievement (beat someone 200+ higher)
    if (args.isWin && args.opponentRating - args.newRating + args.ratingChange >= 200) {
      await award("upset", { opponentRating: args.opponentRating });
    }

    // Comeback achievement (win after 3 losses)
    // This requires tracking loss streak - simplified check
    if (args.isWin && args.currentWinStreak === 1 && totalMatches > 3) {
      // Check previous matches - skip for now as it requires more complex logic
    }

    return {
      newAchievements: newAchievements.map((id) => ACHIEVEMENTS[id]),
    };
  },
});

/**
 * Get achievement counts by rarity
 */
export const getAchievementStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const achievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = achievements.length;

    const byRarity = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0,
    };

    for (const a of achievements) {
      const def = ACHIEVEMENTS[a.achievementType as AchievementId];
      if (def) {
        byRarity[def.rarity as keyof typeof byRarity]++;
      }
    }

    return {
      total: totalAchievements,
      unlocked: unlockedCount,
      percentage: Math.round((unlockedCount / totalAchievements) * 100),
      byRarity,
    };
  },
});
