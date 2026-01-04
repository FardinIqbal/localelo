import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  leaderboards,
  leaderboardRatings,
  organizationMemberships,
  organizations,
  matches,
  matchParticipants,
} from "@/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { subDays } from "date-fns";

export const rankingsRouter = router({
  // Get all user's rankings across all organizations
  myRankings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get all memberships for this user
    const memberships = await ctx.db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.status, "approved")
        )
      );

    if (memberships.length === 0) {
      return [];
    }

    const membershipIds = memberships.map((m) => m.id);

    // Get all ratings for these memberships with org and leaderboard info
    const ratings = await ctx.db
      .select({
        rating: leaderboardRatings,
        leaderboard: leaderboards,
        organization: organizations,
        membership: organizationMemberships,
      })
      .from(leaderboardRatings)
      .innerJoin(leaderboards, eq(leaderboardRatings.leaderboardId, leaderboards.id))
      .innerJoin(organizations, eq(leaderboards.organizationId, organizations.id))
      .innerJoin(
        organizationMemberships,
        eq(leaderboardRatings.membershipId, organizationMemberships.id)
      )
      .where(sql`${leaderboardRatings.membershipId} IN ${membershipIds}`);

    // Calculate rank and enhance each rating
    const oneWeekAgo = subDays(new Date(), 7);

    const enhancedRatings = await Promise.all(
      ratings.map(async (entry) => {
        // Get rank for this leaderboard
        const rankResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(leaderboardRatings)
          .where(
            and(
              eq(leaderboardRatings.leaderboardId, entry.leaderboard.id),
              sql`${leaderboardRatings.rating} > ${entry.rating.rating}`
            )
          );

        const rank = Number(rankResult[0]?.count ?? 0) + 1;

        // Get total competitors
        const totalResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(leaderboardRatings)
          .where(eq(leaderboardRatings.leaderboardId, entry.leaderboard.id));

        const totalCompetitors = Number(totalResult[0]?.count ?? 0);

        // Get win streak
        const recentMatches = await ctx.db
          .select({
            isWinner: matchParticipants.isWinner,
            isDraw: matches.isDraw,
          })
          .from(matchParticipants)
          .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
          .where(
            and(
              eq(matchParticipants.membershipId, entry.membership.id),
              eq(matches.leaderboardId, entry.leaderboard.id),
              eq(matches.status, "active")
            )
          )
          .orderBy(desc(matches.matchTime))
          .limit(20);

        let streak = 0;
        for (const match of recentMatches) {
          if (match.isWinner && !match.isDraw) {
            streak++;
          } else {
            break;
          }
        }

        // Get rating change (last 7 days)
        const recentRatingChanges = await ctx.db
          .select({
            ratingBefore: matchParticipants.ratingBefore,
            ratingAfter: matchParticipants.ratingAfter,
          })
          .from(matchParticipants)
          .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
          .where(
            and(
              eq(matchParticipants.membershipId, entry.membership.id),
              eq(matches.leaderboardId, entry.leaderboard.id),
              eq(matches.status, "active"),
              gte(matches.matchTime, oneWeekAgo)
            )
          );

        let ratingDelta = 0;
        for (const change of recentRatingChanges) {
          if (change.ratingBefore && change.ratingAfter) {
            ratingDelta += change.ratingAfter - change.ratingBefore;
          }
        }

        // Get last match date
        const lastMatch = await ctx.db
          .select({ matchTime: matches.matchTime })
          .from(matchParticipants)
          .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
          .where(
            and(
              eq(matchParticipants.membershipId, entry.membership.id),
              eq(matches.leaderboardId, entry.leaderboard.id),
              eq(matches.status, "active")
            )
          )
          .orderBy(desc(matches.matchTime))
          .limit(1);

        return {
          leaderboardId: entry.leaderboard.id,
          leaderboardName: entry.leaderboard.name,
          organizationId: entry.organization.id,
          organizationName: entry.organization.name,
          organizationSlug: entry.organization.slug,
          rank,
          totalCompetitors,
          rating: entry.rating.rating,
          ratingDelta: Math.round(ratingDelta),
          wins: entry.rating.wins,
          losses: entry.rating.losses,
          draws: entry.rating.draws,
          streak,
          lastMatchDate: lastMatch[0]?.matchTime ?? null,
        };
      })
    );

    // Sort by: recent activity > best rank > alphabetical
    return enhancedRatings.sort((a, b) => {
      // First by last match date (most recent first)
      if (a.lastMatchDate && b.lastMatchDate) {
        return new Date(b.lastMatchDate).getTime() - new Date(a.lastMatchDate).getTime();
      }
      if (a.lastMatchDate && !b.lastMatchDate) return -1;
      if (!a.lastMatchDate && b.lastMatchDate) return 1;

      // Then by best rank
      if (a.rank !== b.rank) return a.rank - b.rank;

      // Then alphabetically
      return a.leaderboardName.localeCompare(b.leaderboardName);
    });
  }),

  // Get summary stats for user
  myRankingsStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get all memberships for this user
    const memberships = await ctx.db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.status, "approved")
        )
      );

    if (memberships.length === 0) {
      return {
        bestRank: null,
        bestRankLeaderboard: null,
        totalLeaderboards: 0,
        totalOrganizations: 0,
        averageRank: null,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        winRate: null,
      };
    }

    const membershipIds = memberships.map((m) => m.id);

    // Get all ratings with leaderboard info
    const ratings = await ctx.db
      .select({
        rating: leaderboardRatings,
        leaderboard: leaderboards,
      })
      .from(leaderboardRatings)
      .innerJoin(leaderboards, eq(leaderboardRatings.leaderboardId, leaderboards.id))
      .where(sql`${leaderboardRatings.membershipId} IN ${membershipIds}`);

    if (ratings.length === 0) {
      return {
        bestRank: null,
        bestRankLeaderboard: null,
        totalLeaderboards: 0,
        totalOrganizations: 0,
        averageRank: null,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        winRate: null,
      };
    }

    // Calculate ranks and find best
    let bestRank = Infinity;
    let bestRankLeaderboard = "";
    let totalRankSum = 0;

    for (const entry of ratings) {
      const rankResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, entry.leaderboard.id),
            sql`${leaderboardRatings.rating} > ${entry.rating.rating}`
          )
        );

      const rank = Number(rankResult[0]?.count ?? 0) + 1;
      totalRankSum += rank;

      if (rank < bestRank) {
        bestRank = rank;
        bestRankLeaderboard = entry.leaderboard.name;
      }
    }

    const uniqueOrgs = new Set(ratings.map((r) => r.leaderboard.organizationId));

    const totalWins = ratings.reduce((sum, r) => sum + r.rating.wins, 0);
    const totalLosses = ratings.reduce((sum, r) => sum + r.rating.losses, 0);
    const totalDraws = ratings.reduce((sum, r) => sum + r.rating.draws, 0);
    const totalMatches = totalWins + totalLosses + totalDraws;

    return {
      bestRank: bestRank === Infinity ? null : bestRank,
      bestRankLeaderboard: bestRank === Infinity ? null : bestRankLeaderboard,
      totalLeaderboards: ratings.length,
      totalOrganizations: uniqueOrgs.size,
      averageRank: Math.round(totalRankSum / ratings.length),
      totalWins,
      totalLosses,
      totalDraws,
      winRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : null,
    };
  }),

  // Get mini-leaderboard preview (top 3 + user context)
  leaderboardPreview: protectedProcedure
    .input(z.object({ leaderboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get all rankings for this leaderboard
      const allRankings = await ctx.db
        .select({
          rating: leaderboardRatings,
          membership: organizationMemberships,
        })
        .from(leaderboardRatings)
        .innerJoin(
          organizationMemberships,
          eq(leaderboardRatings.membershipId, organizationMemberships.id)
        )
        .where(eq(leaderboardRatings.leaderboardId, input.leaderboardId))
        .orderBy(desc(leaderboardRatings.rating));

      // Find user's position
      const userIndex = allRankings.findIndex(
        (r) => r.membership.userId === userId
      );

      // Get top 3
      const top3 = allRankings.slice(0, 3).map((r, i) => ({
        rank: i + 1,
        username: r.membership.username,
        rating: Math.round(r.rating.rating),
        wins: r.rating.wins,
        losses: r.rating.losses,
        draws: r.rating.draws,
        isCurrentUser: r.membership.userId === userId,
      }));

      // Get user context (above, user, below)
      let userContext = null;
      if (userIndex !== -1) {
        const aboveIndex = userIndex > 0 ? userIndex - 1 : null;
        const belowIndex = userIndex < allRankings.length - 1 ? userIndex + 1 : null;

        userContext = {
          aboveUser: aboveIndex !== null
            ? {
                rank: aboveIndex + 1,
                username: allRankings[aboveIndex].membership.username,
                rating: Math.round(allRankings[aboveIndex].rating.rating),
                isCurrentUser: false,
              }
            : null,
          user: {
            rank: userIndex + 1,
            username: allRankings[userIndex].membership.username,
            rating: Math.round(allRankings[userIndex].rating.rating),
            wins: allRankings[userIndex].rating.wins,
            losses: allRankings[userIndex].rating.losses,
            draws: allRankings[userIndex].rating.draws,
            isCurrentUser: true,
          },
          belowUser: belowIndex !== null
            ? {
                rank: belowIndex + 1,
                username: allRankings[belowIndex].membership.username,
                rating: Math.round(allRankings[belowIndex].rating.rating),
                isCurrentUser: false,
              }
            : null,
        };
      }

      return {
        top3,
        userContext,
        totalCompetitors: allRankings.length,
      };
    }),
});
