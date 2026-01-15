import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUser, getMembership } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get leaderboard rankings with all player data
 */
export const getLeaderboard = query({
  args: { leaderboardId: v.id("leaderboards") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", args.leaderboardId))
      .collect();

    // Sort by rating descending
    const sorted = ratings.sort((a, b) => b.rating - a.rating);

    // Enrich with membership data and calculate streak + recent change
    const enriched = await Promise.all(
      sorted.map(async (rating, index) => {
        const membership = await ctx.db.get(rating.membershipId);
        if (!membership) return null;

        // Calculate streak from recent matches
        const recentMatches = await ctx.db
          .query("matchParticipants")
          .withIndex("by_membership", (q) => q.eq("membershipId", rating.membershipId))
          .order("desc")
          .take(20);

        let streak = 0;
        for (const mp of recentMatches) {
          const match = await ctx.db.get(mp.matchId);
          if (!match || match.deletedAt || match.leaderboardId !== args.leaderboardId) continue;
          if (match.isDraw) break;
          if (mp.isWinner) {
            streak++;
          } else {
            break;
          }
        }

        // Calculate 7-day rating change
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const historyEntries = await ctx.db
          .query("ratingHistory")
          .withIndex("by_membership", (q) => q.eq("membershipId", rating.membershipId))
          .filter((q) =>
            q.and(
              q.eq(q.field("leaderboardId"), args.leaderboardId),
              q.gte(q.field("createdAt"), weekAgo)
            )
          )
          .order("asc")
          .take(1);

        const oldestRating = historyEntries[0]?.rating ?? rating.rating;
        const recentChange = Math.round(rating.rating - oldestRating);

        return {
          rank: index + 1,
          rating: rating,
          membership: membership,
          streak,
          recentChange,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

/**
 * Get all rankings for current user across all orgs
 */
export const myRankings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    // Get all memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const results = [];

    for (const membership of memberships) {
      const org = await ctx.db.get(membership.organizationId);
      if (!org) continue;

      // Get all ratings for this membership
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const rating of ratings) {
        const leaderboard = await ctx.db.get(rating.leaderboardId);
        if (!leaderboard) continue;

        // Get rank
        const allRatings = await ctx.db
          .query("ratings")
          .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", rating.leaderboardId))
          .collect();
        const sorted = allRatings.sort((a, b) => b.rating - a.rating);
        const rank = sorted.findIndex((r) => r._id === rating._id) + 1;

        // Calculate streak
        const recentMatches = await ctx.db
          .query("matchParticipants")
          .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
          .order("desc")
          .take(20);

        let streak = 0;
        for (const mp of recentMatches) {
          const match = await ctx.db.get(mp.matchId);
          if (!match || match.deletedAt || match.leaderboardId !== rating.leaderboardId) continue;
          if (match.isDraw) break;
          if (mp.isWinner) {
            streak++;
          } else {
            break;
          }
        }

        // Calculate 7-day rating change
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const historyEntries = await ctx.db
          .query("ratingHistory")
          .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("leaderboardId"), rating.leaderboardId),
              q.gte(q.field("createdAt"), weekAgo)
            )
          )
          .order("asc")
          .take(1);

        const oldestRating = historyEntries[0]?.rating ?? rating.rating;
        const ratingDelta = Math.round(rating.rating - oldestRating);

        // Get last match date
        const lastMatch = recentMatches.length > 0
          ? await ctx.db.get(recentMatches[0].matchId)
          : null;
        const lastMatchDate = lastMatch?.matchTime ?? null;

        // Get total competitors
        const totalCompetitors = allRatings.length;

        results.push({
          leaderboardId: leaderboard._id as string,
          leaderboardName: leaderboard.name,
          organizationId: org._id as string,
          organizationName: org.name,
          organizationSlug: org.slug,
          membershipId: membership._id as string,
          rating: rating.rating,
          rank,
          totalCompetitors,
          wins: rating.wins,
          losses: rating.losses,
          draws: rating.draws,
          streak,
          ratingDelta,
          lastMatchDate,
        });
      }
    }

    // Sort by most recent activity first, then by rating
    return results.sort((a, b) => {
      // Most recent match first
      const aDate = a.lastMatchDate ?? 0;
      const bDate = b.lastMatchDate ?? 0;
      if (aDate !== bDate) return bDate - aDate;
      // Then by rating
      return b.rating - a.rating;
    });
  },
});

/**
 * Get aggregated stats across all leaderboards
 */
export const myRankingsStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) {
      return {
        bestRank: null,
        bestRankLeaderboard: null,
        totalLeaderboards: 0,
        totalOrganizations: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: null,
      };
    }

    // Get all memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    let bestRank: number | null = null;
    let bestRankLeaderboard: string | null = null;
    let totalWins = 0;
    let totalLosses = 0;
    let totalLeaderboards = 0;
    const orgIds = new Set<string>();

    for (const membership of memberships) {
      orgIds.add(membership.organizationId as string);

      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const rating of ratings) {
        totalLeaderboards++;
        totalWins += rating.wins;
        totalLosses += rating.losses;

        // Get rank
        const allRatings = await ctx.db
          .query("ratings")
          .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", rating.leaderboardId))
          .collect();
        const sorted = allRatings.sort((a, b) => b.rating - a.rating);
        const rank = sorted.findIndex((r) => r._id === rating._id) + 1;

        if (bestRank === null || rank < bestRank) {
          bestRank = rank;
          const leaderboard = await ctx.db.get(rating.leaderboardId);
          bestRankLeaderboard = leaderboard?.name ?? null;
        }
      }
    }

    const totalGames = totalWins + totalLosses;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null;

    return {
      bestRank,
      bestRankLeaderboard,
      totalLeaderboards,
      totalOrganizations: orgIds.size,
      totalWins,
      totalLosses,
      winRate,
    };
  },
});

/**
 * Get leaderboard preview (top 3 + user context)
 */
export const leaderboardPreview = query({
  args: { leaderboardId: v.id("leaderboards") },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", args.leaderboardId))
      .collect();

    // Sort by rating descending
    const sorted = ratings.sort((a, b) => b.rating - a.rating);

    // Get top 3
    const top3 = await Promise.all(
      sorted.slice(0, 3).map(async (rating, index) => {
        const membership = await ctx.db.get(rating.membershipId);
        const userMembership = user
          ? await ctx.db
              .query("memberships")
              .withIndex("by_user", (q) => q.eq("userId", user._id))
              .collect()
          : [];
        const isCurrentUser = userMembership.some((m) => m._id === rating.membershipId);

        return {
          rank: index + 1,
          username: membership?.username ?? "Unknown",
          rating: Math.round(rating.rating),
          isCurrentUser,
        };
      })
    );

    // Find current user's context if not in top 3
    let userContext = null;
    if (user) {
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const membershipIds = memberships.map((m) => m._id);
      const userRatingIndex = sorted.findIndex((r) => membershipIds.includes(r.membershipId));

      if (userRatingIndex > 2) {
        const userRating = sorted[userRatingIndex];
        const userMembership = memberships.find((m) => m._id === userRating.membershipId);

        const aboveIndex = userRatingIndex - 1;
        const belowIndex = userRatingIndex + 1;

        const aboveRating = sorted[aboveIndex];
        const belowRating = sorted[belowIndex];

        const aboveMembership = aboveRating ? await ctx.db.get(aboveRating.membershipId) : null;
        const belowMembership = belowRating ? await ctx.db.get(belowRating.membershipId) : null;

        userContext = {
          user: {
            rank: userRatingIndex + 1,
            username: userMembership?.username ?? "Unknown",
            rating: Math.round(userRating.rating),
          },
          aboveUser: aboveMembership ? {
            rank: aboveIndex + 1,
            username: aboveMembership.username,
            rating: Math.round(aboveRating.rating),
          } : null,
          belowUser: belowMembership ? {
            rank: belowIndex + 1,
            username: belowMembership.username,
            rating: Math.round(belowRating.rating),
          } : null,
        };
      }
    }

    return { top3, userContext };
  },
});
