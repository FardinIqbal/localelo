import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { challenges, leaderboardRatings, organizationMemberships, users, leaderboards, organizations } from "@/db/schema";
import { eq, and, or, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const challengesRouter = router({
  // Send a challenge to another player
  send: protectedProcedure
    .input(
      z.object({
        opponentRatingId: z.string(), // leaderboardRatings.id
        leaderboardId: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get challenger's leaderboard rating via their org membership
      const challengerRating = await ctx.db
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
            eq(organizationMemberships.userId, userId),
            eq(leaderboardRatings.leaderboardId, input.leaderboardId)
          )
        )
        .limit(1);

      if (challengerRating.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this leaderboard",
        });
      }

      // Check opponent exists on same leaderboard
      const opponentRating = await ctx.db.query.leaderboardRatings.findFirst({
        where: and(
          eq(leaderboardRatings.id, input.opponentRatingId),
          eq(leaderboardRatings.leaderboardId, input.leaderboardId)
        ),
      });

      if (!opponentRating) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Opponent not found on this leaderboard",
        });
      }

      // Check for existing pending challenge between these players
      const existingChallenge = await ctx.db.query.challenges.findFirst({
        where: and(
          or(
            and(
              eq(challenges.challengerMembershipId, challengerRating[0].rating.id),
              eq(challenges.challengedMembershipId, input.opponentRatingId)
            ),
            and(
              eq(challenges.challengerMembershipId, input.opponentRatingId),
              eq(challenges.challengedMembershipId, challengerRating[0].rating.id)
            )
          ),
          eq(challenges.status, "pending")
        ),
      });

      if (existingChallenge) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending challenge already exists between you and this player",
        });
      }

      // Create challenge - expires in 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const [challenge] = await ctx.db
        .insert(challenges)
        .values({
          challengerMembershipId: challengerRating[0].rating.id,
          challengedMembershipId: input.opponentRatingId,
          leaderboardId: input.leaderboardId,
          status: "pending",
          message: input.message,
          expiresAt,
        })
        .returning();

      return challenge;
    }),

  // Accept a challenge
  accept: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get the challenge
      const challenge = await ctx.db.query.challenges.findFirst({
        where: eq(challenges.id, input.challengeId),
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Verify user is the challenged player
      const userRating = await ctx.db
        .select({ rating: leaderboardRatings })
        .from(leaderboardRatings)
        .innerJoin(
          organizationMemberships,
          eq(leaderboardRatings.membershipId, organizationMemberships.id)
        )
        .where(
          and(
            eq(organizationMemberships.userId, userId),
            eq(leaderboardRatings.id, challenge.challengedMembershipId)
          )
        )
        .limit(1);

      if (userRating.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the challenged player",
        });
      }

      if (challenge.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is no longer pending",
        });
      }

      if (challenge.expiresAt && new Date() > challenge.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge has expired",
        });
      }

      // Update challenge status
      const [updated] = await ctx.db
        .update(challenges)
        .set({ status: "accepted" })
        .where(eq(challenges.id, input.challengeId))
        .returning();

      return updated;
    }),

  // Decline a challenge
  decline: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const challenge = await ctx.db.query.challenges.findFirst({
        where: eq(challenges.id, input.challengeId),
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Verify user is the challenged player
      const userRating = await ctx.db
        .select({ rating: leaderboardRatings })
        .from(leaderboardRatings)
        .innerJoin(
          organizationMemberships,
          eq(leaderboardRatings.membershipId, organizationMemberships.id)
        )
        .where(
          and(
            eq(organizationMemberships.userId, userId),
            eq(leaderboardRatings.id, challenge.challengedMembershipId)
          )
        )
        .limit(1);

      if (userRating.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the challenged player",
        });
      }

      if (challenge.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is no longer pending",
        });
      }

      const [updated] = await ctx.db
        .update(challenges)
        .set({ status: "declined" })
        .where(eq(challenges.id, input.challengeId))
        .returning();

      return updated;
    }),

  // Cancel a sent challenge
  cancel: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const challenge = await ctx.db.query.challenges.findFirst({
        where: eq(challenges.id, input.challengeId),
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Verify user is the challenger
      const userRating = await ctx.db
        .select({ rating: leaderboardRatings })
        .from(leaderboardRatings)
        .innerJoin(
          organizationMemberships,
          eq(leaderboardRatings.membershipId, organizationMemberships.id)
        )
        .where(
          and(
            eq(organizationMemberships.userId, userId),
            eq(leaderboardRatings.id, challenge.challengerMembershipId)
          )
        )
        .limit(1);

      if (userRating.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the challenger",
        });
      }

      if (challenge.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is no longer pending",
        });
      }

      const [updated] = await ctx.db
        .update(challenges)
        .set({ status: "cancelled" })
        .where(eq(challenges.id, input.challengeId))
        .returning();

      return updated;
    }),

  // Mark challenge as completed (when match is logged)
  complete: protectedProcedure
    .input(z.object({ challengeId: z.string(), matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.db.query.challenges.findFirst({
        where: eq(challenges.id, input.challengeId),
      });

      if (!challenge || challenge.status !== "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge cannot be completed",
        });
      }

      const [updated] = await ctx.db
        .update(challenges)
        .set({
          status: "completed",
          matchId: input.matchId,
          completedAt: new Date(),
        })
        .where(eq(challenges.id, input.challengeId))
        .returning();

      return updated;
    }),

  // Get pending challenges for current user
  getPending: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get all user's leaderboard ratings
    const userRatings = await ctx.db
      .select({ rating: leaderboardRatings })
      .from(leaderboardRatings)
      .innerJoin(
        organizationMemberships,
        eq(leaderboardRatings.membershipId, organizationMemberships.id)
      )
      .where(eq(organizationMemberships.userId, userId));

    if (userRatings.length === 0) {
      return { received: [], sent: [] };
    }

    const ratingIds = userRatings.map((r) => r.rating.id);

    // Get all pending challenges
    const allChallenges = await ctx.db.query.challenges.findMany({
      where: and(
        eq(challenges.status, "pending"),
        gte(challenges.expiresAt, new Date())
      ),
      with: {
        leaderboard: {
          with: {
            organization: true,
          },
        },
      },
      orderBy: [desc(challenges.createdAt)],
    });

    // Get user info for each challenge
    const received = [];
    const sent = [];

    for (const challenge of allChallenges) {
      if (ratingIds.includes(challenge.challengedMembershipId)) {
        // Get challenger info
        const challengerInfo = await ctx.db
          .select({
            rating: leaderboardRatings,
            membership: organizationMemberships,
            user: users,
          })
          .from(leaderboardRatings)
          .innerJoin(
            organizationMemberships,
            eq(leaderboardRatings.membershipId, organizationMemberships.id)
          )
          .innerJoin(users, eq(organizationMemberships.userId, users.id))
          .where(eq(leaderboardRatings.id, challenge.challengerMembershipId))
          .limit(1);

        if (challengerInfo.length > 0) {
          received.push({
            ...challenge,
            challengerMembership: {
              user: {
                displayName: challengerInfo[0].user.firstName
                  ? `${challengerInfo[0].user.firstName} ${challengerInfo[0].user.lastName || ""}`
                  : null,
                imageUrl: challengerInfo[0].user.imageUrl,
              },
              rating: challengerInfo[0].rating.rating,
            },
          });
        }
      } else if (ratingIds.includes(challenge.challengerMembershipId)) {
        // Get challenged player info
        const challengedInfo = await ctx.db
          .select({
            rating: leaderboardRatings,
            membership: organizationMemberships,
            user: users,
          })
          .from(leaderboardRatings)
          .innerJoin(
            organizationMemberships,
            eq(leaderboardRatings.membershipId, organizationMemberships.id)
          )
          .innerJoin(users, eq(organizationMemberships.userId, users.id))
          .where(eq(leaderboardRatings.id, challenge.challengedMembershipId))
          .limit(1);

        if (challengedInfo.length > 0) {
          sent.push({
            ...challenge,
            challengedMembership: {
              user: {
                displayName: challengedInfo[0].user.firstName
                  ? `${challengedInfo[0].user.firstName} ${challengedInfo[0].user.lastName || ""}`
                  : null,
                imageUrl: challengedInfo[0].user.imageUrl,
              },
              rating: challengedInfo[0].rating.rating,
            },
          });
        }
      }
    }

    return { received, sent };
  }),

  // Get accepted challenges (ready to play)
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const userRatings = await ctx.db
      .select({ rating: leaderboardRatings })
      .from(leaderboardRatings)
      .innerJoin(
        organizationMemberships,
        eq(leaderboardRatings.membershipId, organizationMemberships.id)
      )
      .where(eq(organizationMemberships.userId, userId));

    if (userRatings.length === 0) {
      return [];
    }

    const ratingIds = userRatings.map((r) => r.rating.id);

    const activeChallenges = await ctx.db.query.challenges.findMany({
      where: eq(challenges.status, "accepted"),
      with: {
        leaderboard: {
          with: {
            organization: true,
          },
        },
      },
      orderBy: [desc(challenges.createdAt)],
    });

    const result = [];

    for (const challenge of activeChallenges) {
      if (
        ratingIds.includes(challenge.challengerMembershipId) ||
        ratingIds.includes(challenge.challengedMembershipId)
      ) {
        // Get both players' info
        const [challengerInfo, challengedInfo] = await Promise.all([
          ctx.db
            .select({
              rating: leaderboardRatings,
              membership: organizationMemberships,
              user: users,
            })
            .from(leaderboardRatings)
            .innerJoin(
              organizationMemberships,
              eq(leaderboardRatings.membershipId, organizationMemberships.id)
            )
            .innerJoin(users, eq(organizationMemberships.userId, users.id))
            .where(eq(leaderboardRatings.id, challenge.challengerMembershipId))
            .limit(1),
          ctx.db
            .select({
              rating: leaderboardRatings,
              membership: organizationMemberships,
              user: users,
            })
            .from(leaderboardRatings)
            .innerJoin(
              organizationMemberships,
              eq(leaderboardRatings.membershipId, organizationMemberships.id)
            )
            .innerJoin(users, eq(organizationMemberships.userId, users.id))
            .where(eq(leaderboardRatings.id, challenge.challengedMembershipId))
            .limit(1),
        ]);

        result.push({
          ...challenge,
          challengerMembership:
            challengerInfo.length > 0
              ? {
                  user: {
                    displayName: challengerInfo[0].user.firstName
                      ? `${challengerInfo[0].user.firstName} ${challengerInfo[0].user.lastName || ""}`
                      : null,
                    imageUrl: challengerInfo[0].user.imageUrl,
                  },
                  rating: challengerInfo[0].rating.rating,
                }
              : null,
          challengedMembership:
            challengedInfo.length > 0
              ? {
                  user: {
                    displayName: challengedInfo[0].user.firstName
                      ? `${challengedInfo[0].user.firstName} ${challengedInfo[0].user.lastName || ""}`
                      : null,
                    imageUrl: challengedInfo[0].user.imageUrl,
                  },
                  rating: challengedInfo[0].rating.rating,
                }
              : null,
        });
      }
    }

    return result;
  }),

  // Get challenge history
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const userRatings = await ctx.db
        .select({ rating: leaderboardRatings })
        .from(leaderboardRatings)
        .innerJoin(
          organizationMemberships,
          eq(leaderboardRatings.membershipId, organizationMemberships.id)
        )
        .where(eq(organizationMemberships.userId, userId));

      if (userRatings.length === 0) {
        return [];
      }

      const ratingIds = userRatings.map((r) => r.rating.id);

      const history = await ctx.db.query.challenges.findMany({
        with: {
          leaderboard: {
            with: {
              organization: true,
            },
          },
        },
        orderBy: [desc(challenges.createdAt)],
        limit: input.limit * 2,
      });

      const result = [];

      for (const challenge of history) {
        if (
          ratingIds.includes(challenge.challengerMembershipId) ||
          ratingIds.includes(challenge.challengedMembershipId)
        ) {
          result.push(challenge);
          if (result.length >= input.limit) break;
        }
      }

      return result;
    }),
});
