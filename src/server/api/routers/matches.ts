import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  matches,
  matchParticipants,
  leaderboardRatings,
  leaderboards,
  organizationMemberships,
  ratingHistory,
  recentOpponents,
} from "@/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { processMatch } from "@/lib/elo";

export const matchesRouter = router({
  // Get recent opponents for quick match
  recentOpponents: protectedProcedure
    .input(z.object({ leaderboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get leaderboard
      const [leaderboard] = await ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.id, input.leaderboardId))
        .limit(1);

      if (!leaderboard) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get user's membership
      const [userMembership] = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, leaderboard.organizationId),
            eq(organizationMemberships.userId, ctx.user.id),
            eq(organizationMemberships.status, "approved")
          )
        )
        .limit(1);

      if (!userMembership) {
        return [];
      }

      // Get recent opponents sorted by last played
      const recent = await ctx.db
        .select({
          id: recentOpponents.id,
          opponentMembershipId: recentOpponents.opponentMembershipId,
          matchCount: recentOpponents.matchCount,
          lastPlayedAt: recentOpponents.lastPlayedAt,
        })
        .from(recentOpponents)
        .where(
          and(
            eq(recentOpponents.membershipId, userMembership.id),
            eq(recentOpponents.leaderboardId, input.leaderboardId)
          )
        )
        .orderBy(desc(recentOpponents.lastPlayedAt))
        .limit(6);

      if (recent.length === 0) {
        return [];
      }

      // Get opponent details
      const opponentIds = recent.map((r) => r.opponentMembershipId);
      const opponents = await ctx.db
        .select({
          membership: organizationMemberships,
          rating: leaderboardRatings,
        })
        .from(organizationMemberships)
        .leftJoin(
          leaderboardRatings,
          and(
            eq(leaderboardRatings.membershipId, organizationMemberships.id),
            eq(leaderboardRatings.leaderboardId, input.leaderboardId)
          )
        )
        .where(
          or(...opponentIds.map((id) => eq(organizationMemberships.id, id)))
        );

      return recent.map((r) => {
        const opponent = opponents.find(
          (o) => o.membership.id === r.opponentMembershipId
        );
        return {
          id: r.id,
          opponentMembershipId: r.opponentMembershipId,
          opponentUsername: opponent?.membership.username ?? "Unknown",
          opponentRating: opponent?.rating?.rating ?? 1500,
          matchCount: r.matchCount,
          lastPlayedAt: r.lastPlayedAt,
        };
      });
    }),

  // Get matches for a leaderboard
  byLeaderboard: publicProcedure
    .input(
      z.object({
        leaderboardId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const matchList = await ctx.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.leaderboardId, input.leaderboardId),
            eq(matches.status, "active")
          )
        )
        .orderBy(desc(matches.matchTime))
        .limit(input.limit);

      // Get participants for each match
      const matchIds = matchList.map((m) => m.id);
      if (matchIds.length === 0) return [];

      const participants = await ctx.db
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
          or(...matchIds.map((id) => eq(matchParticipants.matchId, id)))
        );

      return matchList.map((match) => ({
        ...match,
        participants: participants.filter((p) => p.participant.matchId === match.id),
      }));
    }),

  // Get matches involving a specific member
  byMember: publicProcedure
    .input(
      z.object({
        membershipId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const memberMatches = await ctx.db
        .select()
        .from(matchParticipants)
        .where(eq(matchParticipants.membershipId, input.membershipId))
        .orderBy(desc(matchParticipants.createdAt))
        .limit(input.limit);

      const matchIds = memberMatches.map((m) => m.matchId);
      if (matchIds.length === 0) return [];

      const matchList = await ctx.db
        .select()
        .from(matches)
        .where(
          and(
            or(...matchIds.map((id) => eq(matches.id, id))),
            eq(matches.status, "active")
          )
        )
        .orderBy(desc(matches.matchTime));

      const participants = await ctx.db
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
          or(...matchIds.map((id) => eq(matchParticipants.matchId, id)))
        );

      return matchList.map((match) => ({
        ...match,
        participants: participants.filter((p) => p.participant.matchId === match.id),
      }));
    }),

  // Log a new match
  create: protectedProcedure
    .input(
      z.object({
        leaderboardId: z.string().uuid(),
        opponentMembershipId: z.string().uuid(),
        outcome: z.enum(["win", "loss", "draw"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get leaderboard
      const [leaderboard] = await ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.id, input.leaderboardId))
        .limit(1);

      if (!leaderboard) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get user's membership
      const [userMembership] = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, leaderboard.organizationId),
            eq(organizationMemberships.userId, ctx.user.id),
            eq(organizationMemberships.status, "approved")
          )
        )
        .limit(1);

      if (!userMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be an approved member to log matches",
        });
      }

      // Check opponent is valid
      const [opponentMembership] = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.id, input.opponentMembershipId),
            eq(organizationMemberships.organizationId, leaderboard.organizationId),
            eq(organizationMemberships.status, "approved")
          )
        )
        .limit(1);

      if (!opponentMembership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Opponent not found",
        });
      }

      if (opponentMembership.id === userMembership.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot play against yourself",
        });
      }

      // Get both players' ratings
      const [userRating] = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, input.leaderboardId),
            eq(leaderboardRatings.membershipId, userMembership.id)
          )
        )
        .limit(1);

      const [opponentRating] = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, input.leaderboardId),
            eq(leaderboardRatings.membershipId, opponentMembership.id)
          )
        )
        .limit(1);

      if (!userRating || !opponentRating) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both players must have ratings on this leaderboard",
        });
      }

      // Calculate new ratings
      const outcome =
        input.outcome === "win"
          ? "player1"
          : input.outcome === "loss"
            ? "player2"
            : "draw";

      const newRatings = processMatch(
        {
          rating: userRating.rating,
          ratingDeviation: userRating.ratingDeviation,
          volatility: userRating.volatility,
        },
        {
          rating: opponentRating.rating,
          ratingDeviation: opponentRating.ratingDeviation,
          volatility: opponentRating.volatility,
        },
        outcome
      );

      // Create match
      const winnerId =
        input.outcome === "win"
          ? userMembership.id
          : input.outcome === "loss"
            ? opponentMembership.id
            : null;

      const now = new Date();
      const [match] = await ctx.db
        .insert(matches)
        .values({
          leaderboardId: input.leaderboardId,
          winnerMembershipId: winnerId,
          isDraw: input.outcome === "draw",
          matchTime: now,
          ratedAt: now,
        })
        .returning();

      // Create participants
      await ctx.db.insert(matchParticipants).values([
        {
          matchId: match.id,
          membershipId: userMembership.id,
          isWinner: input.outcome === "win",
          ratingBefore: userRating.rating,
          ratingAfter: newRatings.player1.rating,
          ratingDeviationBefore: userRating.ratingDeviation,
          ratingDeviationAfter: newRatings.player1.ratingDeviation,
          volatilityBefore: userRating.volatility,
          volatilityAfter: newRatings.player1.volatility,
        },
        {
          matchId: match.id,
          membershipId: opponentMembership.id,
          isWinner: input.outcome === "loss",
          ratingBefore: opponentRating.rating,
          ratingAfter: newRatings.player2.rating,
          ratingDeviationBefore: opponentRating.ratingDeviation,
          ratingDeviationAfter: newRatings.player2.ratingDeviation,
          volatilityBefore: opponentRating.volatility,
          volatilityAfter: newRatings.player2.volatility,
        },
      ]);

      // Update ratings
      await ctx.db
        .update(leaderboardRatings)
        .set({
          rating: newRatings.player1.rating,
          ratingDeviation: newRatings.player1.ratingDeviation,
          volatility: newRatings.player1.volatility,
          wins: input.outcome === "win" ? userRating.wins + 1 : userRating.wins,
          losses:
            input.outcome === "loss" ? userRating.losses + 1 : userRating.losses,
          draws:
            input.outcome === "draw" ? userRating.draws + 1 : userRating.draws,
          lastRatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leaderboardRatings.id, userRating.id));

      await ctx.db
        .update(leaderboardRatings)
        .set({
          rating: newRatings.player2.rating,
          ratingDeviation: newRatings.player2.ratingDeviation,
          volatility: newRatings.player2.volatility,
          wins:
            input.outcome === "loss"
              ? opponentRating.wins + 1
              : opponentRating.wins,
          losses:
            input.outcome === "win"
              ? opponentRating.losses + 1
              : opponentRating.losses,
          draws:
            input.outcome === "draw"
              ? opponentRating.draws + 1
              : opponentRating.draws,
          lastRatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leaderboardRatings.id, opponentRating.id));

      // Save rating history
      await ctx.db.insert(ratingHistory).values([
        {
          membershipId: userMembership.id,
          leaderboardId: input.leaderboardId,
          matchId: match.id,
          rating: newRatings.player1.rating,
          ratingDeviation: newRatings.player1.ratingDeviation,
          volatility: newRatings.player1.volatility,
        },
        {
          membershipId: opponentMembership.id,
          leaderboardId: input.leaderboardId,
          matchId: match.id,
          rating: newRatings.player2.rating,
          ratingDeviation: newRatings.player2.ratingDeviation,
          volatility: newRatings.player2.volatility,
        },
      ]);

      // Update recent opponents for both players
      const updateRecentOpponent = async (
        membershipId: string,
        opponentId: string
      ) => {
        const [existing] = await ctx.db
          .select()
          .from(recentOpponents)
          .where(
            and(
              eq(recentOpponents.membershipId, membershipId),
              eq(recentOpponents.opponentMembershipId, opponentId),
              eq(recentOpponents.leaderboardId, input.leaderboardId)
            )
          )
          .limit(1);

        if (existing) {
          await ctx.db
            .update(recentOpponents)
            .set({
              matchCount: existing.matchCount + 1,
              lastPlayedAt: new Date(),
            })
            .where(eq(recentOpponents.id, existing.id));
        } else {
          await ctx.db.insert(recentOpponents).values({
            membershipId,
            opponentMembershipId: opponentId,
            leaderboardId: input.leaderboardId,
            matchCount: 1,
            lastPlayedAt: new Date(),
          });
        }
      };

      // Update for both players
      await Promise.all([
        updateRecentOpponent(userMembership.id, opponentMembership.id),
        updateRecentOpponent(opponentMembership.id, userMembership.id),
      ]);

      // Return match with rating change for feedback
      return {
        ...match,
        ratingDelta: Math.round(newRatings.player1.rating - userRating.rating),
        newRating: Math.round(newRatings.player1.rating),
      };
    }),

  // Head-to-head stats between two players
  headToHead: publicProcedure
    .input(
      z.object({
        leaderboardId: z.string().uuid(),
        player1MembershipId: z.string().uuid(),
        player2MembershipId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all matches where both players participated
      const p1Matches = await ctx.db
        .select({ matchId: matchParticipants.matchId })
        .from(matchParticipants)
        .where(eq(matchParticipants.membershipId, input.player1MembershipId));

      const p2Matches = await ctx.db
        .select({ matchId: matchParticipants.matchId })
        .from(matchParticipants)
        .where(eq(matchParticipants.membershipId, input.player2MembershipId));

      const p1MatchIds = new Set(p1Matches.map((m) => m.matchId));
      const commonMatchIds = p2Matches
        .filter((m) => p1MatchIds.has(m.matchId))
        .map((m) => m.matchId);

      if (commonMatchIds.length === 0) {
        return {
          player1Wins: 0,
          player2Wins: 0,
          draws: 0,
          totalMatches: 0,
          recentMatches: [],
        };
      }

      // Get match details
      const matchList = await ctx.db
        .select()
        .from(matches)
        .where(
          and(
            or(...commonMatchIds.map((id) => eq(matches.id, id))),
            eq(matches.leaderboardId, input.leaderboardId),
            eq(matches.status, "active")
          )
        )
        .orderBy(desc(matches.matchTime))
        .limit(10);

      // Calculate stats
      let player1Wins = 0;
      let player2Wins = 0;
      let draws = 0;

      for (const match of matchList) {
        if (match.isDraw) {
          draws++;
        } else if (match.winnerMembershipId === input.player1MembershipId) {
          player1Wins++;
        } else if (match.winnerMembershipId === input.player2MembershipId) {
          player2Wins++;
        }
      }

      return {
        player1Wins,
        player2Wins,
        draws,
        totalMatches: matchList.length,
        recentMatches: matchList,
      };
    }),

  // Admin log match between any two players
  adminCreate: protectedProcedure
    .input(
      z.object({
        leaderboardId: z.string().uuid(),
        player1MembershipId: z.string().uuid(),
        player2MembershipId: z.string().uuid(),
        winnerId: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get leaderboard
      const [leaderboard] = await ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.id, input.leaderboardId))
        .limit(1);

      if (!leaderboard) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check user is admin of the organization
      const [userMembership] = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, leaderboard.organizationId),
            eq(organizationMemberships.userId, ctx.user.id),
            eq(organizationMemberships.status, "approved")
          )
        )
        .limit(1);

      if (!userMembership || (!userMembership.isAdmin && !userMembership.isOwner)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can log matches for other players",
        });
      }

      // Get both players' ratings
      const [player1Rating] = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, input.leaderboardId),
            eq(leaderboardRatings.membershipId, input.player1MembershipId)
          )
        )
        .limit(1);

      const [player2Rating] = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, input.leaderboardId),
            eq(leaderboardRatings.membershipId, input.player2MembershipId)
          )
        )
        .limit(1);

      if (!player1Rating || !player2Rating) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both players must have ratings on this leaderboard",
        });
      }

      // Calculate outcome
      const outcome =
        input.winnerId === input.player1MembershipId
          ? "player1"
          : input.winnerId === input.player2MembershipId
            ? "player2"
            : "draw";

      // Calculate new ratings
      const newRatings = processMatch(
        {
          rating: player1Rating.rating,
          ratingDeviation: player1Rating.ratingDeviation,
          volatility: player1Rating.volatility,
        },
        {
          rating: player2Rating.rating,
          ratingDeviation: player2Rating.ratingDeviation,
          volatility: player2Rating.volatility,
        },
        outcome
      );

      // Create match
      const now = new Date();
      const [match] = await ctx.db
        .insert(matches)
        .values({
          leaderboardId: input.leaderboardId,
          winnerMembershipId: input.winnerId,
          isDraw: input.winnerId === null,
          matchTime: now,
          ratedAt: now,
        })
        .returning();

      // Create participants
      await ctx.db.insert(matchParticipants).values([
        {
          matchId: match.id,
          membershipId: input.player1MembershipId,
          isWinner: input.winnerId === input.player1MembershipId,
          ratingBefore: player1Rating.rating,
          ratingAfter: newRatings.player1.rating,
          ratingDeviationBefore: player1Rating.ratingDeviation,
          ratingDeviationAfter: newRatings.player1.ratingDeviation,
          volatilityBefore: player1Rating.volatility,
          volatilityAfter: newRatings.player1.volatility,
        },
        {
          matchId: match.id,
          membershipId: input.player2MembershipId,
          isWinner: input.winnerId === input.player2MembershipId,
          ratingBefore: player2Rating.rating,
          ratingAfter: newRatings.player2.rating,
          ratingDeviationBefore: player2Rating.ratingDeviation,
          ratingDeviationAfter: newRatings.player2.ratingDeviation,
          volatilityBefore: player2Rating.volatility,
          volatilityAfter: newRatings.player2.volatility,
        },
      ]);

      // Update ratings
      await ctx.db
        .update(leaderboardRatings)
        .set({
          rating: newRatings.player1.rating,
          ratingDeviation: newRatings.player1.ratingDeviation,
          volatility: newRatings.player1.volatility,
          wins:
            outcome === "player1"
              ? player1Rating.wins + 1
              : player1Rating.wins,
          losses:
            outcome === "player2"
              ? player1Rating.losses + 1
              : player1Rating.losses,
          draws:
            outcome === "draw" ? player1Rating.draws + 1 : player1Rating.draws,
          lastRatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leaderboardRatings.id, player1Rating.id));

      await ctx.db
        .update(leaderboardRatings)
        .set({
          rating: newRatings.player2.rating,
          ratingDeviation: newRatings.player2.ratingDeviation,
          volatility: newRatings.player2.volatility,
          wins:
            outcome === "player2"
              ? player2Rating.wins + 1
              : player2Rating.wins,
          losses:
            outcome === "player1"
              ? player2Rating.losses + 1
              : player2Rating.losses,
          draws:
            outcome === "draw" ? player2Rating.draws + 1 : player2Rating.draws,
          lastRatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leaderboardRatings.id, player2Rating.id));

      // Save rating history
      await ctx.db.insert(ratingHistory).values([
        {
          membershipId: input.player1MembershipId,
          leaderboardId: input.leaderboardId,
          matchId: match.id,
          rating: newRatings.player1.rating,
          ratingDeviation: newRatings.player1.ratingDeviation,
          volatility: newRatings.player1.volatility,
        },
        {
          membershipId: input.player2MembershipId,
          leaderboardId: input.leaderboardId,
          matchId: match.id,
          rating: newRatings.player2.rating,
          ratingDeviation: newRatings.player2.ratingDeviation,
          volatility: newRatings.player2.volatility,
        },
      ]);

      return match;
    }),
});
