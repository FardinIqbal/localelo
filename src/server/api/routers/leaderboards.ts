import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  leaderboards,
  leaderboardRatings,
  organizationMemberships,
  organizations,
  matches,
  matchParticipants,
} from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { subDays } from "date-fns";

export const leaderboardsRouter = router({
  // Get leaderboards for an organization
  byOrganization: publicProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.organizationId, input.organizationId))
        .orderBy(desc(leaderboards.createdAt));
    }),

  // Get a single leaderboard
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [leaderboard] = await ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.id, input.id))
        .limit(1);

      if (!leaderboard) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return leaderboard;
    }),

  // Get rankings for a leaderboard
  rankings: publicProcedure
    .input(z.object({ leaderboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const baseRankings = await ctx.db
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

      // Enhance with streak and recent change data
      const oneWeekAgo = subDays(new Date(), 7);

      const enhancedRankings = await Promise.all(
        baseRankings.map(async (entry) => {
          // Get recent matches for streak calculation
          const recentMatches = await ctx.db
            .select({
              isWinner: matchParticipants.isWinner,
              isDraw: matches.isDraw,
              matchTime: matches.matchTime,
            })
            .from(matchParticipants)
            .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
            .where(
              and(
                eq(matchParticipants.membershipId, entry.membership.id),
                eq(matches.leaderboardId, input.leaderboardId),
                eq(matches.status, "active")
              )
            )
            .orderBy(desc(matches.matchTime))
            .limit(20);

          // Calculate current win streak
          let streak = 0;
          for (const match of recentMatches) {
            if (match.isWinner && !match.isDraw) {
              streak++;
            } else {
              break;
            }
          }

          // Calculate recent rating change (last 7 days)
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
                eq(matches.leaderboardId, input.leaderboardId),
                gte(matches.matchTime, oneWeekAgo),
                eq(matches.status, "active")
              )
            );

          let recentChange = 0;
          for (const change of recentRatingChanges) {
            if (change.ratingBefore && change.ratingAfter) {
              recentChange += change.ratingAfter - change.ratingBefore;
            }
          }

          return {
            ...entry,
            streak,
            recentChange: Math.round(recentChange),
          };
        })
      );

      return enhancedRankings;
    }),

  // Create a leaderboard
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        sport: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check user is admin of org
      const [membership] = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, input.organizationId),
            eq(organizationMemberships.userId, ctx.user.id),
            eq(organizationMemberships.status, "approved")
          )
        )
        .limit(1);

      if (!membership || (!membership.isAdmin && !membership.isOwner)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create leaderboards",
        });
      }

      // Create leaderboard
      const [leaderboard] = await ctx.db
        .insert(leaderboards)
        .values(input)
        .returning();

      // Add all approved members to the leaderboard
      const members = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, input.organizationId),
            eq(organizationMemberships.status, "approved")
          )
        );

      if (members.length > 0) {
        await ctx.db.insert(leaderboardRatings).values(
          members.map((m) => ({
            leaderboardId: leaderboard.id,
            membershipId: m.id,
          }))
        );
      }

      return leaderboard;
    }),

  // Get user's rating for a leaderboard
  myRating: protectedProcedure
    .input(z.object({ leaderboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [leaderboard] = await ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.id, input.leaderboardId))
        .limit(1);

      if (!leaderboard) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [membership] = await ctx.db
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

      if (!membership) {
        return null;
      }

      const [rating] = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, input.leaderboardId),
            eq(leaderboardRatings.membershipId, membership.id)
          )
        )
        .limit(1);

      return rating ?? null;
    }),

  // Join a leaderboard
  join: protectedProcedure
    .input(z.object({ leaderboardId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [leaderboard] = await ctx.db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.id, input.leaderboardId))
        .limit(1);

      if (!leaderboard) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get user's membership
      const [membership] = await ctx.db
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

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be an approved member to join leaderboards",
        });
      }

      // Check if already has a rating
      const [existing] = await ctx.db
        .select()
        .from(leaderboardRatings)
        .where(
          and(
            eq(leaderboardRatings.leaderboardId, input.leaderboardId),
            eq(leaderboardRatings.membershipId, membership.id)
          )
        )
        .limit(1);

      if (existing) {
        return existing;
      }

      // Create rating
      const [rating] = await ctx.db
        .insert(leaderboardRatings)
        .values({
          leaderboardId: input.leaderboardId,
          membershipId: membership.id,
        })
        .returning();

      return rating;
    }),
});
