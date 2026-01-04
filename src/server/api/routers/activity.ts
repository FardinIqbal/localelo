import { router, protectedProcedure } from "../trpc";
import {
  matches,
  matchParticipants,
  leaderboardRatings,
  leaderboards,
  organizationMemberships,
  organizations,
  users,
} from "@/db/schema";
import { eq, and, desc, sql, gte, ne, or } from "drizzle-orm";
import { subDays, formatDistanceToNow } from "date-fns";

export const activityRouter = router({
  // Get user's recent activity across all organizations
  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    // Get all user's memberships
    const memberships = await ctx.db
      .select({
        membership: organizationMemberships,
        organization: organizations,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        )
      );

    if (memberships.length === 0) return [];

    const membershipIds = memberships.map((m) => m.membership.id);
    const membershipMap = new Map(
      memberships.map((m) => [m.membership.id, m])
    );

    // Get recent match participations
    const recentParticipations = await ctx.db
      .select({
        participant: matchParticipants,
        match: matches,
        leaderboard: leaderboards,
      })
      .from(matchParticipants)
      .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
      .innerJoin(leaderboards, eq(matches.leaderboardId, leaderboards.id))
      .where(
        and(
          sql`${matchParticipants.membershipId} IN (${sql.join(
            membershipIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          eq(matches.status, "active")
        )
      )
      .orderBy(desc(matches.matchTime))
      .limit(20);

    // Get opponent info for each match
    const activity = await Promise.all(
      recentParticipations.map(async (p) => {
        // Get opponent
        const opponents = await ctx.db
          .select({
            participant: matchParticipants,
            membership: organizationMemberships,
          })
          .from(matchParticipants)
          .innerJoin(
            organizationMemberships,
            eq(matchParticipants.membershipId, organizationMemberships.id)
          )
          .where(
            and(
              eq(matchParticipants.matchId, p.match.id),
              ne(matchParticipants.membershipId, p.participant.membershipId)
            )
          )
          .limit(1);

        const opponent = opponents[0];
        const userMembership = membershipMap.get(p.participant.membershipId);
        const isWin = p.participant.isWinner;
        const isDraw = p.match.isDraw;

        const ratingChange = p.participant.ratingAfter && p.participant.ratingBefore
          ? Math.round(p.participant.ratingAfter - p.participant.ratingBefore)
          : 0;

        return {
          type: isDraw ? "draw" : isWin ? "win" : "loss",
          title: isDraw
            ? `Drew with ${opponent?.membership.username || "Unknown"}`
            : isWin
              ? `You beat ${opponent?.membership.username || "Unknown"}`
              : `${opponent?.membership.username || "Unknown"} beat you`,
          subtitle: `${ratingChange >= 0 ? "+" : ""}${ratingChange} rating in ${p.leaderboard.name}`,
          time: formatDistanceToNow(new Date(p.match.matchTime), { addSuffix: true }),
          matchTime: p.match.matchTime,
          orgSlug: userMembership?.organization.slug,
          leaderboardId: p.leaderboard.id,
          ratingChange,
        };
      })
    );

    return activity;
  }),

  // Get dashboard stats
  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    // Get all user's memberships
    const memberships = await ctx.db
      .select({
        membership: organizationMemberships,
        organization: organizations,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        )
      );

    if (memberships.length === 0) {
      return {
        bestRank: null,
        topStreak: 0,
        matchesThisWeek: 0,
        totalWins: 0,
        totalLosses: 0,
      };
    }

    const membershipIds = memberships.map((m) => m.membership.id);

    // Get all ratings to find best rank
    const ratings = await ctx.db
      .select({
        rating: leaderboardRatings,
        leaderboard: leaderboards,
      })
      .from(leaderboardRatings)
      .innerJoin(leaderboards, eq(leaderboardRatings.leaderboardId, leaderboards.id))
      .where(
        sql`${leaderboardRatings.membershipId} IN (${sql.join(
          membershipIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    // Calculate rank for each rating
    let bestRank: number | null = null;
    for (const r of ratings) {
      const higherRatings = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, r.leaderboard.id),
            sql`${leaderboardRatings.rating} > ${r.rating.rating}`
          )
        );
      const rank = Number(higherRatings[0]?.count || 0) + 1;
      if (bestRank === null || rank < bestRank) {
        bestRank = rank;
      }
    }

    // Calculate total wins/losses
    const totalWins = ratings.reduce((sum, r) => sum + r.rating.wins, 0);
    const totalLosses = ratings.reduce((sum, r) => sum + r.rating.losses, 0);

    // Get matches this week
    const oneWeekAgo = subDays(new Date(), 7);
    const matchesThisWeek = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(matchParticipants)
      .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
      .where(
        and(
          sql`${matchParticipants.membershipId} IN (${sql.join(
            membershipIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          gte(matches.matchTime, oneWeekAgo),
          eq(matches.status, "active")
        )
      );

    // Calculate current streak (consecutive wins)
    const recentMatches = await ctx.db
      .select({
        isWinner: matchParticipants.isWinner,
        isDraw: matches.isDraw,
      })
      .from(matchParticipants)
      .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
      .where(
        and(
          sql`${matchParticipants.membershipId} IN (${sql.join(
            membershipIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          eq(matches.status, "active")
        )
      )
      .orderBy(desc(matches.matchTime))
      .limit(50);

    let topStreak = 0;
    let currentStreak = 0;
    for (const m of recentMatches) {
      if (m.isWinner && !m.isDraw) {
        currentStreak++;
        topStreak = Math.max(topStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      bestRank,
      topStreak,
      matchesThisWeek: Number(matchesThisWeek[0]?.count || 0),
      totalWins,
      totalLosses,
    };
  }),

  // Get ducking alerts - opponents you haven't faced recently
  duckingAlerts: protectedProcedure.query(async ({ ctx }) => {
    // Get all user's memberships
    const memberships = await ctx.db
      .select({
        membership: organizationMemberships,
        organization: organizations,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        )
      );

    if (memberships.length === 0) return [];

    const alerts = [];

    for (const m of memberships) {
      // Get other members in this org with similar rating
      const userRatings = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(eq(leaderboardRatings.membershipId, m.membership.id));

      for (const userRating of userRatings) {
        // Get leaderboard info
        const [leaderboard] = await ctx.db
          .select()
          .from(leaderboards)
          .where(eq(leaderboards.id, userRating.leaderboardId))
          .limit(1);

        if (!leaderboard) continue;

        // Find opponents with similar rating (within 200 points)
        const nearbyOpponents = await ctx.db
          .select({
            rating: leaderboardRatings,
            membership: organizationMemberships,
          })
          .from(leaderboardRatings)
          .innerJoin(
            organizationMemberships,
            eq(leaderboardRatings.membershipId, organizationMemberships.id)
          )
          .where(
            and(
              eq(leaderboardRatings.leaderboardId, userRating.leaderboardId),
              ne(leaderboardRatings.membershipId, m.membership.id),
              sql`ABS(${leaderboardRatings.rating} - ${userRating.rating}) < 200`
            )
          )
          .limit(5);

        for (const opponent of nearbyOpponents) {
          // Check last match between user and this opponent
          const userMatches = await ctx.db
            .select({ matchId: matchParticipants.matchId })
            .from(matchParticipants)
            .where(eq(matchParticipants.membershipId, m.membership.id));

          const opponentMatches = await ctx.db
            .select({ matchId: matchParticipants.matchId })
            .from(matchParticipants)
            .where(eq(matchParticipants.membershipId, opponent.membership.id));

          const userMatchIds = new Set(userMatches.map((x) => x.matchId));
          const commonMatchIds = opponentMatches
            .filter((x) => userMatchIds.has(x.matchId))
            .map((x) => x.matchId);

          let daysSinceLastMatch = 999;
          if (commonMatchIds.length > 0) {
            const [lastMatch] = await ctx.db
              .select()
              .from(matches)
              .where(
                and(
                  sql`${matches.id} IN (${sql.join(
                    commonMatchIds.map((id) => sql`${id}`),
                    sql`, `
                  )})`,
                  eq(matches.leaderboardId, userRating.leaderboardId),
                  eq(matches.status, "active")
                )
              )
              .orderBy(desc(matches.matchTime))
              .limit(1);

            if (lastMatch) {
              daysSinceLastMatch = Math.floor(
                (Date.now() - new Date(lastMatch.matchTime).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
            }
          }

          // Alert if more than 10 days since last match (or never played)
          if (daysSinceLastMatch > 10) {
            alerts.push({
              name: opponent.membership.username,
              days: daysSinceLastMatch === 999 ? null : daysSinceLastMatch,
              org: m.organization.name,
              orgSlug: m.organization.slug,
              leaderboardId: leaderboard.id,
              leaderboardName: leaderboard.name,
              opponentRating: Math.round(opponent.rating.rating),
              userRating: Math.round(userRating.rating),
            });
          }
        }
      }
    }

    // Sort by days (null = never played comes first)
    return alerts.sort((a, b) => {
      if (a.days === null) return -1;
      if (b.days === null) return 1;
      return b.days - a.days;
    }).slice(0, 3); // Top 3 ducking alerts
  }),

  // Get user's org stats (for org cards)
  orgStats: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db
      .select({
        membership: organizationMemberships,
        organization: organizations,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        )
      );

    const orgStats = await Promise.all(
      memberships.map(async (m) => {
        // Get user's ratings in this org
        const ratings = await ctx.db
          .select({
            rating: leaderboardRatings,
            leaderboard: leaderboards,
          })
          .from(leaderboardRatings)
          .innerJoin(leaderboards, eq(leaderboardRatings.leaderboardId, leaderboards.id))
          .where(
            and(
              eq(leaderboardRatings.membershipId, m.membership.id),
              eq(leaderboards.organizationId, m.organization.id)
            )
          );

        // Find best rating and calculate rank
        let bestRating: number | null = null;
        let bestRank: number | null = null;
        let totalWins = 0;
        let totalLosses = 0;

        for (const r of ratings) {
          totalWins += r.rating.wins;
          totalLosses += r.rating.losses;

          if (bestRating === null || r.rating.rating > bestRating) {
            bestRating = r.rating.rating;

            // Calculate rank for this leaderboard
            const higherRatings = await ctx.db
              .select({ count: sql<number>`count(*)` })
              .from(leaderboardRatings)
              .where(
                and(
                  eq(leaderboardRatings.leaderboardId, r.leaderboard.id),
                  sql`${leaderboardRatings.rating} > ${r.rating.rating}`
                )
              );
            bestRank = Number(higherRatings[0]?.count || 0) + 1;
          }
        }

        // Calculate recent rating change (last 7 days)
        const oneWeekAgo = subDays(new Date(), 7);
        const recentMatches = await ctx.db
          .select({
            ratingBefore: matchParticipants.ratingBefore,
            ratingAfter: matchParticipants.ratingAfter,
          })
          .from(matchParticipants)
          .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
          .innerJoin(leaderboards, eq(matches.leaderboardId, leaderboards.id))
          .where(
            and(
              eq(matchParticipants.membershipId, m.membership.id),
              eq(leaderboards.organizationId, m.organization.id),
              gte(matches.matchTime, oneWeekAgo),
              eq(matches.status, "active")
            )
          )
          .orderBy(matches.matchTime);

        let recentChange = 0;
        for (const match of recentMatches) {
          if (match.ratingBefore && match.ratingAfter) {
            recentChange += match.ratingAfter - match.ratingBefore;
          }
        }

        // Calculate win streak
        const allRecentMatches = await ctx.db
          .select({
            isWinner: matchParticipants.isWinner,
            isDraw: matches.isDraw,
          })
          .from(matchParticipants)
          .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
          .innerJoin(leaderboards, eq(matches.leaderboardId, leaderboards.id))
          .where(
            and(
              eq(matchParticipants.membershipId, m.membership.id),
              eq(leaderboards.organizationId, m.organization.id),
              eq(matches.status, "active")
            )
          )
          .orderBy(desc(matches.matchTime))
          .limit(20);

        let streak = 0;
        for (const match of allRecentMatches) {
          if (match.isWinner && !match.isDraw) {
            streak++;
          } else {
            break;
          }
        }

        return {
          organizationId: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.membership.isOwner ? "Owner" : m.membership.isAdmin ? "Admin" : "Member",
          rank: bestRank,
          rating: bestRating,
          recentChange: Math.round(recentChange),
          streak,
          totalWins,
          totalLosses,
        };
      })
    );

    return orgStats;
  }),

  // Get user's top rivalries
  rivalries: protectedProcedure.query(async ({ ctx }) => {
    // Get all user's memberships
    const memberships = await ctx.db
      .select({
        membership: organizationMemberships,
        organization: organizations,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id)
      )
      .where(
        and(
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        )
      );

    if (memberships.length === 0) return [];

    const rivalries: Array<{
      opponentName: string;
      opponentMembershipId: string;
      orgName: string;
      orgSlug: string;
      leaderboardId: string;
      leaderboardName: string;
      totalMatches: number;
      userWins: number;
      opponentWins: number;
      draws: number;
      userRating: number;
      opponentRating: number;
      lastMatchTime: Date;
    }> = [];

    for (const m of memberships) {
      // Get all user's match participations in this org
      const userParticipations = await ctx.db
        .select({
          matchId: matchParticipants.matchId,
          isWinner: matchParticipants.isWinner,
        })
        .from(matchParticipants)
        .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
        .innerJoin(leaderboards, eq(matches.leaderboardId, leaderboards.id))
        .where(
          and(
            eq(matchParticipants.membershipId, m.membership.id),
            eq(leaderboards.organizationId, m.organization.id),
            eq(matches.status, "active")
          )
        );

      if (userParticipations.length === 0) continue;

      const userMatchIds = userParticipations.map((p) => p.matchId);
      const userMatchWins = new Map(
        userParticipations.map((p) => [p.matchId, p.isWinner])
      );

      // Find opponents in these matches
      const opponentParticipations = await ctx.db
        .select({
          matchId: matchParticipants.matchId,
          membershipId: matchParticipants.membershipId,
          isWinner: matchParticipants.isWinner,
          membership: organizationMemberships,
        })
        .from(matchParticipants)
        .innerJoin(
          organizationMemberships,
          eq(matchParticipants.membershipId, organizationMemberships.id)
        )
        .where(
          and(
            sql`${matchParticipants.matchId} IN (${sql.join(
              userMatchIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            ne(matchParticipants.membershipId, m.membership.id)
          )
        );

      // Group by opponent
      const opponentStats = new Map<
        string,
        {
          membershipId: string;
          username: string;
          matchIds: string[];
          wins: number;
          losses: number;
          draws: number;
        }
      >();

      for (const op of opponentParticipations) {
        const existing = opponentStats.get(op.membershipId) || {
          membershipId: op.membershipId,
          username: op.membership.username,
          matchIds: [],
          wins: 0,
          losses: 0,
          draws: 0,
        };

        existing.matchIds.push(op.matchId);
        const userWon = userMatchWins.get(op.matchId);
        const opponentWon = op.isWinner;

        if (userWon) {
          existing.wins++;
        } else if (opponentWon) {
          existing.losses++;
        } else {
          existing.draws++;
        }

        opponentStats.set(op.membershipId, existing);
      }

      // Find top rivalries (most matches played)
      const sortedOpponents = Array.from(opponentStats.values())
        .filter((o) => o.matchIds.length >= 2) // At least 2 matches to be a rivalry
        .sort((a, b) => b.matchIds.length - a.matchIds.length)
        .slice(0, 3);

      for (const opponent of sortedOpponents) {
        // Get leaderboard info and ratings
        const [firstMatch] = await ctx.db
          .select({
            match: matches,
            leaderboard: leaderboards,
          })
          .from(matches)
          .innerJoin(leaderboards, eq(matches.leaderboardId, leaderboards.id))
          .where(
            sql`${matches.id} IN (${sql.join(
              opponent.matchIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .orderBy(desc(matches.matchTime))
          .limit(1);

        if (!firstMatch) continue;

        // Get current ratings
        const [userRating] = await ctx.db
          .select()
          .from(leaderboardRatings)
          .where(
            and(
              eq(leaderboardRatings.leaderboardId, firstMatch.leaderboard.id),
              eq(leaderboardRatings.membershipId, m.membership.id)
            )
          )
          .limit(1);

        const [opponentRating] = await ctx.db
          .select()
          .from(leaderboardRatings)
          .where(
            and(
              eq(leaderboardRatings.leaderboardId, firstMatch.leaderboard.id),
              eq(leaderboardRatings.membershipId, opponent.membershipId)
            )
          )
          .limit(1);

        rivalries.push({
          opponentName: opponent.username,
          opponentMembershipId: opponent.membershipId,
          orgName: m.organization.name,
          orgSlug: m.organization.slug,
          leaderboardId: firstMatch.leaderboard.id,
          leaderboardName: firstMatch.leaderboard.name,
          totalMatches: opponent.matchIds.length,
          userWins: opponent.wins,
          opponentWins: opponent.losses,
          draws: opponent.draws,
          userRating: userRating?.rating ?? 1500,
          opponentRating: opponentRating?.rating ?? 1500,
          lastMatchTime: firstMatch.match.matchTime,
        });
      }
    }

    // Sort by most matches and return top 5
    return rivalries
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, 5);
  }),
});
