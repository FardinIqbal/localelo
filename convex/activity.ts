import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUser, getMembership } from "./auth";

/**
 * Get recent activity (matches) for current user
 */
export const recentActivity = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    // Get user's memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const membershipIds = memberships.map((m) => m._id);
    const results = [];

    for (const membershipId of membershipIds) {
      const membership = memberships.find((m) => m._id === membershipId);
      if (!membership) continue;

      const participations = await ctx.db
        .query("matchParticipants")
        .withIndex("by_membership", (q) => q.eq("membershipId", membershipId))
        .order("desc")
        .take(10);

      for (const participation of participations) {
        const match = await ctx.db.get(participation.matchId);
        if (!match || match.deletedAt) continue;

        const leaderboard = await ctx.db.get(match.leaderboardId);
        if (!leaderboard) continue;

        const org = await ctx.db.get(leaderboard.organizationId);
        if (!org) continue;

        // Get opponent
        const allParticipants = await ctx.db
          .query("matchParticipants")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .collect();

        const opponent = allParticipants.find((p) => p.membershipId !== membershipId);
        if (!opponent) continue;

        const opponentMembership = await ctx.db.get(opponent.membershipId);
        if (!opponentMembership) continue;

        const ratingChange =
          participation.ratingAfter && participation.ratingBefore
            ? Math.round(participation.ratingAfter - participation.ratingBefore)
            : 0;

        const type = match.isDraw ? "draw" : participation.isWinner ? "win" : "loss";

        results.push({
          matchId: match._id,
          type,
          title: `${type === "win" ? "Beat" : type === "loss" ? "Lost to" : "Drew with"} ${opponentMembership.username}`,
          subtitle: `${ratingChange >= 0 ? "+" : ""}${ratingChange} rating in ${leaderboard.name}`,
          time: formatTimeAgo(match.matchTime),
          matchTime: match.matchTime,
          leaderboardName: leaderboard.name,
          orgSlug: org.slug,
        });
      }
    }

    // Sort by match time and take top 20
    return results.sort((a, b) => b.matchTime - a.matchTime).slice(0, 20);
  },
});

/**
 * Get dashboard stats
 */
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user)
      return {
        bestRank: null,
        topStreak: 0,
        matchesThisWeek: 0,
        totalWins: 0,
        totalLosses: 0,
      };

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    let bestRank: number | null = null;
    let topStreak = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let matchesThisWeek = 0;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const membership of memberships) {
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const rating of ratings) {
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
        }

        // Calculate streak
        const recentMatches = await ctx.db
          .query("matchParticipants")
          .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
          .order("desc")
          .take(20);

        let streak = 0;
        for (const mp of recentMatches) {
          const match = await ctx.db.get(mp.matchId);
          if (!match || match.deletedAt || match.leaderboardId !== rating.leaderboardId)
            continue;
          if (match.isDraw) break;
          if (mp.isWinner) {
            streak++;
          } else {
            break;
          }
        }

        if (streak > topStreak) {
          topStreak = streak;
        }
      }

      // Count matches this week
      const participations = await ctx.db
        .query("matchParticipants")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const p of participations) {
        const match = await ctx.db.get(p.matchId);
        if (match && !match.deletedAt && match.matchTime >= weekAgo) {
          matchesThisWeek++;
        }
      }
    }

    return {
      bestRank,
      topStreak,
      matchesThisWeek,
      totalWins,
      totalLosses,
    };
  },
});

/**
 * Get org-level stats for dashboard
 */
export const orgStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const results = [];

    for (const membership of memberships) {
      const org = await ctx.db.get(membership.organizationId);
      if (!org) continue;

      // Get best rating in this org
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
        .collect();

      let bestRating = null;
      let bestRank = null;
      let streak = 0;

      for (const rating of ratings) {
        if (!bestRating || rating.rating > bestRating) {
          bestRating = rating.rating;

          // Get rank
          const allRatings = await ctx.db
            .query("ratings")
            .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", rating.leaderboardId))
            .collect();
          const sorted = allRatings.sort((a, b) => b.rating - a.rating);
          bestRank = sorted.findIndex((r) => r._id === rating._id) + 1;

          // Get streak
          const recentMatches = await ctx.db
            .query("matchParticipants")
            .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
            .order("desc")
            .take(20);

          streak = 0;
          for (const mp of recentMatches) {
            const match = await ctx.db.get(mp.matchId);
            if (!match || match.deletedAt || match.leaderboardId !== rating.leaderboardId)
              continue;
            if (match.isDraw) break;
            if (mp.isWinner) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      results.push({
        organizationId: org._id,
        name: org.name,
        slug: org.slug,
        role: membership.isOwner ? "Owner" : membership.isAdmin ? "Admin" : "Member",
        rank: bestRank,
        rating: bestRating,
        streak,
        recentChange: 0, // TODO: calculate from history
      });
    }

    return results;
  },
});

/**
 * Get top rivalries (most matches played against same opponent)
 */
export const rivalries = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const rivalryMap = new Map<
      string,
      {
        opponentMembershipId: string;
        leaderboardId: string;
        totalMatches: number;
        userWins: number;
        opponentWins: number;
        draws: number;
      }
    >();

    for (const membership of memberships) {
      const recentOpps = await ctx.db
        .query("recentOpponents")
        .withIndex("by_member", (q) => q.eq("membershipId", membership._id))
        .collect();

      for (const ro of recentOpps) {
        const key = `${ro.opponentMembershipId}-${ro.leaderboardId}`;
        if (!rivalryMap.has(key)) {
          // Count wins/losses
          const myParticipations = await ctx.db
            .query("matchParticipants")
            .withIndex("by_membership", (q) => q.eq("membershipId", membership._id))
            .collect();

          let userWins = 0;
          let opponentWins = 0;
          let draws = 0;

          for (const mp of myParticipations) {
            const match = await ctx.db.get(mp.matchId);
            if (!match || match.deletedAt || match.leaderboardId !== ro.leaderboardId) continue;

            const opponents = await ctx.db
              .query("matchParticipants")
              .withIndex("by_match", (q) => q.eq("matchId", mp.matchId))
              .filter((q) => q.neq(q.field("membershipId"), membership._id))
              .collect();

            const isAgainstThisOpponent = opponents.some(
              (o) => o.membershipId === ro.opponentMembershipId
            );
            if (!isAgainstThisOpponent) continue;

            if (match.isDraw) {
              draws++;
            } else if (mp.isWinner) {
              userWins++;
            } else {
              opponentWins++;
            }
          }

          rivalryMap.set(key, {
            opponentMembershipId: ro.opponentMembershipId as string,
            leaderboardId: ro.leaderboardId as string,
            totalMatches: ro.matchCount,
            userWins,
            opponentWins,
            draws,
          });
        }
      }
    }

    // Convert to array and enrich
    const rivalries = Array.from(rivalryMap.values())
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, 5);

    const enriched = await Promise.all(
      rivalries.map(async (r) => {
        const opponentMembership = await ctx.db.get(r.opponentMembershipId as any);
        if (!opponentMembership) return null;

        const leaderboard = await ctx.db.get(r.leaderboardId as any);
        if (!leaderboard) return null;

        const org = await ctx.db.get(leaderboard.organizationId);
        if (!org) return null;

        return {
          opponentMembershipId: r.opponentMembershipId,
          opponentName: opponentMembership.username,
          leaderboardId: r.leaderboardId,
          leaderboardName: leaderboard.name,
          orgName: org.name,
          orgSlug: org.slug,
          totalMatches: r.totalMatches,
          userWins: r.userWins,
          opponentWins: r.opponentWins,
          draws: r.draws,
          userRating: 0,
          opponentRating: 0,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}
