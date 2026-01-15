import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, getMembership, isOrgAdmin } from "./auth";
import { processMatch, DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOLATILITY } from "./lib/glicko2";
import { Id } from "./_generated/dataModel";

/**
 * Get recent opponents for quick-match UI
 */
export const recentOpponents = query({
  args: { leaderboardId: v.id("leaderboards") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const leaderboard = await ctx.db.get(args.leaderboardId);

    if (!leaderboard) return [];

    const membership = await getMembership(ctx, user._id, leaderboard.organizationId);
    if (!membership) return [];

    // Get recent opponents
    const recent = await ctx.db
      .query("recentOpponents")
      .withIndex("by_member", (q) => q.eq("membershipId", membership._id))
      .filter((q) => q.eq(q.field("leaderboardId"), args.leaderboardId))
      .order("desc")
      .take(6);

    // Enrich with opponent data
    const enriched = await Promise.all(
      recent.map(async (ro) => {
        const opponentMembership = await ctx.db.get(ro.opponentMembershipId);
        if (!opponentMembership) return null;

        const opponentRating = await ctx.db
          .query("ratings")
          .withIndex("by_leaderboard_membership", (q) =>
            q.eq("leaderboardId", args.leaderboardId).eq("membershipId", ro.opponentMembershipId)
          )
          .unique();

        return {
          id: ro._id,
          opponentMembershipId: ro.opponentMembershipId,
          opponentUsername: opponentMembership.username,
          opponentRating: opponentRating?.rating ?? DEFAULT_RATING,
          matchCount: ro.matchCount,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

/**
 * Log a match (main match creation)
 */
export const create = mutation({
  args: {
    leaderboardId: v.id("leaderboards"),
    opponentMembershipId: v.id("memberships"),
    outcome: v.union(v.literal("win"), v.literal("loss"), v.literal("draw")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const leaderboard = await ctx.db.get(args.leaderboardId);

    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    // Get player's membership
    const myMembership = await getMembership(ctx, user._id, leaderboard.organizationId);
    if (!myMembership || myMembership.status !== "approved") {
      throw new Error("Not a member of this organization");
    }

    // Validate opponent
    const opponentMembership = await ctx.db.get(args.opponentMembershipId);
    if (!opponentMembership || opponentMembership.status !== "approved") {
      throw new Error("Opponent not found or not approved");
    }

    if (myMembership._id === args.opponentMembershipId) {
      throw new Error("Cannot play against yourself");
    }

    // Get ratings
    const myRating = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard_membership", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("membershipId", myMembership._id)
      )
      .unique();

    const opponentRating = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard_membership", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("membershipId", args.opponentMembershipId)
      )
      .unique();

    if (!myRating || !opponentRating) {
      throw new Error("Rating not found");
    }

    // Calculate new ratings using Glicko-2
    const glickoOutcome =
      args.outcome === "win" ? "player1" : args.outcome === "loss" ? "player2" : "draw";

    const result = processMatch(
      {
        rating: myRating.rating,
        ratingDeviation: myRating.ratingDeviation,
        volatility: myRating.volatility,
      },
      {
        rating: opponentRating.rating,
        ratingDeviation: opponentRating.ratingDeviation,
        volatility: opponentRating.volatility,
      },
      glickoOutcome
    );

    const now = Date.now();

    // Create match record
    const matchId = await ctx.db.insert("matches", {
      leaderboardId: args.leaderboardId,
      winnerMembershipId: args.outcome === "win" ? myMembership._id : args.outcome === "loss" ? args.opponentMembershipId : undefined,
      isDraw: args.outcome === "draw",
      status: "active",
      matchTime: now,
      ratedAt: now,
    });

    // Create match participants
    await ctx.db.insert("matchParticipants", {
      matchId,
      membershipId: myMembership._id,
      isWinner: args.outcome === "win",
      ratingBefore: myRating.rating,
      ratingAfter: result.player1.rating,
      ratingDeviationBefore: myRating.ratingDeviation,
      ratingDeviationAfter: result.player1.ratingDeviation,
      volatilityBefore: myRating.volatility,
      volatilityAfter: result.player1.volatility,
    });

    await ctx.db.insert("matchParticipants", {
      matchId,
      membershipId: args.opponentMembershipId,
      isWinner: args.outcome === "loss",
      ratingBefore: opponentRating.rating,
      ratingAfter: result.player2.rating,
      ratingDeviationBefore: opponentRating.ratingDeviation,
      ratingDeviationAfter: result.player2.ratingDeviation,
      volatilityBefore: opponentRating.volatility,
      volatilityAfter: result.player2.volatility,
    });

    // Update ratings
    await ctx.db.patch(myRating._id, {
      rating: result.player1.rating,
      ratingDeviation: result.player1.ratingDeviation,
      volatility: result.player1.volatility,
      wins: myRating.wins + (args.outcome === "win" ? 1 : 0),
      losses: myRating.losses + (args.outcome === "loss" ? 1 : 0),
      draws: myRating.draws + (args.outcome === "draw" ? 1 : 0),
      lastRatedAt: now,
    });

    await ctx.db.patch(opponentRating._id, {
      rating: result.player2.rating,
      ratingDeviation: result.player2.ratingDeviation,
      volatility: result.player2.volatility,
      wins: opponentRating.wins + (args.outcome === "loss" ? 1 : 0),
      losses: opponentRating.losses + (args.outcome === "win" ? 1 : 0),
      draws: opponentRating.draws + (args.outcome === "draw" ? 1 : 0),
      lastRatedAt: now,
    });

    // Save rating history
    await ctx.db.insert("ratingHistory", {
      membershipId: myMembership._id,
      leaderboardId: args.leaderboardId,
      matchId,
      rating: result.player1.rating,
      ratingDeviation: result.player1.ratingDeviation,
      volatility: result.player1.volatility,
      createdAt: now,
    });

    await ctx.db.insert("ratingHistory", {
      membershipId: args.opponentMembershipId,
      leaderboardId: args.leaderboardId,
      matchId,
      rating: result.player2.rating,
      ratingDeviation: result.player2.ratingDeviation,
      volatility: result.player2.volatility,
      createdAt: now,
    });

    // Update recent opponents (bidirectional)
    await updateRecentOpponent(ctx, myMembership._id, args.opponentMembershipId, args.leaderboardId, now);
    await updateRecentOpponent(ctx, args.opponentMembershipId, myMembership._id, args.leaderboardId, now);

    const ratingDelta = result.player1.rating - myRating.rating;

    return {
      id: matchId,
      ratingDelta: Math.round(ratingDelta),
      newRating: result.player1.rating,
    };
  },
});

async function updateRecentOpponent(
  ctx: any,
  membershipId: Id<"memberships">,
  opponentMembershipId: Id<"memberships">,
  leaderboardId: Id<"leaderboards">,
  now: number
) {
  const existing = await ctx.db
    .query("recentOpponents")
    .withIndex("by_member_opponent_leaderboard", (q: any) =>
      q
        .eq("membershipId", membershipId)
        .eq("opponentMembershipId", opponentMembershipId)
        .eq("leaderboardId", leaderboardId)
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      matchCount: existing.matchCount + 1,
      lastPlayedAt: now,
    });
  } else {
    await ctx.db.insert("recentOpponents", {
      membershipId,
      opponentMembershipId,
      leaderboardId,
      matchCount: 1,
      lastPlayedAt: now,
    });
  }
}

/**
 * Undo a recent match (soft delete + restore ratings)
 */
export const undo = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const match = await ctx.db.get(args.matchId);

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.deletedAt) {
      throw new Error("Match already deleted");
    }

    // Check if within 5-minute window
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (match.matchTime < fiveMinutesAgo) {
      throw new Error("Can only undo matches within 5 minutes");
    }

    const leaderboard = await ctx.db.get(match.leaderboardId);
    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    // Check if user is a participant or admin
    const membership = await getMembership(ctx, user._id, leaderboard.organizationId);
    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    const participants = await ctx.db
      .query("matchParticipants")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    const isParticipant = participants.some((p) => p.membershipId === membership._id);
    const isAdmin = await isOrgAdmin(ctx, user._id, leaderboard.organizationId);

    if (!isParticipant && !isAdmin) {
      throw new Error("Not authorized to undo this match");
    }

    // Soft delete match
    await ctx.db.patch(args.matchId, {
      deletedAt: Date.now(),
      deletedBy: user._id,
    });

    // Restore ratings
    for (const participant of participants) {
      const rating = await ctx.db
        .query("ratings")
        .withIndex("by_leaderboard_membership", (q) =>
          q.eq("leaderboardId", match.leaderboardId).eq("membershipId", participant.membershipId)
        )
        .unique();

      if (rating && participant.ratingBefore !== undefined) {
        await ctx.db.patch(rating._id, {
          rating: participant.ratingBefore,
          ratingDeviation: participant.ratingDeviationBefore ?? rating.ratingDeviation,
          volatility: participant.volatilityBefore ?? rating.volatility,
          wins: rating.wins - (participant.isWinner ? 1 : 0),
          losses: rating.losses - (!participant.isWinner && !match.isDraw ? 1 : 0),
          draws: rating.draws - (match.isDraw ? 1 : 0),
        });
      }

      // Decrement recent opponent count
      const otherParticipant = participants.find((p) => p._id !== participant._id);
      if (otherParticipant) {
        const recentOpp = await ctx.db
          .query("recentOpponents")
          .withIndex("by_member_opponent_leaderboard", (q: any) =>
            q
              .eq("membershipId", participant.membershipId)
              .eq("opponentMembershipId", otherParticipant.membershipId)
              .eq("leaderboardId", match.leaderboardId)
          )
          .unique();

        if (recentOpp) {
          if (recentOpp.matchCount <= 1) {
            await ctx.db.delete(recentOpp._id);
          } else {
            await ctx.db.patch(recentOpp._id, {
              matchCount: recentOpp.matchCount - 1,
            });
          }
        }
      }
    }

    // Delete rating history entries
    const historyEntries = await ctx.db
      .query("ratingHistory")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    for (const entry of historyEntries) {
      await ctx.db.delete(entry._id);
    }

    return { success: true };
  },
});

/**
 * Get matches that can be undone by current user
 */
export const undoable = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    // Get user's memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const membershipIds = memberships.map((m) => m._id);

    // Get recent match participations
    const results = [];

    for (const membershipId of membershipIds) {
      const participations = await ctx.db
        .query("matchParticipants")
        .withIndex("by_membership", (q) => q.eq("membershipId", membershipId))
        .order("desc")
        .take(10);

      for (const participation of participations) {
        const match = await ctx.db.get(participation.matchId);
        if (!match) continue;
        if (match.deletedAt) continue;
        if (match.matchTime < fiveMinutesAgo) continue;

        results.push({
          matchId: match._id,
          matchTime: match.matchTime,
          canUndo: true,
        });
      }
    }

    return results;
  },
});

/**
 * Get matches for a leaderboard
 */
export const byLeaderboard = query({
  args: { leaderboardId: v.id("leaderboards"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", args.leaderboardId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .take(args.limit ?? 20);

    return Promise.all(
      matches.map(async (match) => {
        const participants = await ctx.db
          .query("matchParticipants")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .collect();

        const enrichedParticipants = await Promise.all(
          participants.map(async (p) => {
            const membership = await ctx.db.get(p.membershipId);
            return { ...p, membership };
          })
        );

        return { ...match, participants: enrichedParticipants };
      })
    );
  },
});

/**
 * Admin: Log match for any two players
 */
export const adminCreate = mutation({
  args: {
    leaderboardId: v.id("leaderboards"),
    player1MembershipId: v.id("memberships"),
    player2MembershipId: v.id("memberships"),
    winnerId: v.optional(v.id("memberships")), // null for draw
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const leaderboard = await ctx.db.get(args.leaderboardId);

    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    // Check admin
    if (!(await isOrgAdmin(ctx, user._id, leaderboard.organizationId))) {
      throw new Error("Not authorized");
    }

    if (args.player1MembershipId === args.player2MembershipId) {
      throw new Error("Cannot log match with same player");
    }

    const isDraw = !args.winnerId;
    const outcome =
      args.winnerId === args.player1MembershipId
        ? "player1"
        : args.winnerId === args.player2MembershipId
          ? "player2"
          : "draw";

    // Get ratings
    const rating1 = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard_membership", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("membershipId", args.player1MembershipId)
      )
      .unique();

    const rating2 = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard_membership", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("membershipId", args.player2MembershipId)
      )
      .unique();

    if (!rating1 || !rating2) {
      throw new Error("Rating not found for one or both players");
    }

    // Calculate new ratings
    const result = processMatch(
      {
        rating: rating1.rating,
        ratingDeviation: rating1.ratingDeviation,
        volatility: rating1.volatility,
      },
      {
        rating: rating2.rating,
        ratingDeviation: rating2.ratingDeviation,
        volatility: rating2.volatility,
      },
      outcome
    );

    const now = Date.now();

    // Create match
    const matchId = await ctx.db.insert("matches", {
      leaderboardId: args.leaderboardId,
      winnerMembershipId: args.winnerId,
      isDraw,
      status: "active",
      matchTime: now,
      ratedAt: now,
    });

    // Create participants
    await ctx.db.insert("matchParticipants", {
      matchId,
      membershipId: args.player1MembershipId,
      isWinner: args.winnerId === args.player1MembershipId,
      ratingBefore: rating1.rating,
      ratingAfter: result.player1.rating,
      ratingDeviationBefore: rating1.ratingDeviation,
      ratingDeviationAfter: result.player1.ratingDeviation,
      volatilityBefore: rating1.volatility,
      volatilityAfter: result.player1.volatility,
    });

    await ctx.db.insert("matchParticipants", {
      matchId,
      membershipId: args.player2MembershipId,
      isWinner: args.winnerId === args.player2MembershipId,
      ratingBefore: rating2.rating,
      ratingAfter: result.player2.rating,
      ratingDeviationBefore: rating2.ratingDeviation,
      ratingDeviationAfter: result.player2.ratingDeviation,
      volatilityBefore: rating2.volatility,
      volatilityAfter: result.player2.volatility,
    });

    // Update ratings
    await ctx.db.patch(rating1._id, {
      rating: result.player1.rating,
      ratingDeviation: result.player1.ratingDeviation,
      volatility: result.player1.volatility,
      wins: rating1.wins + (outcome === "player1" ? 1 : 0),
      losses: rating1.losses + (outcome === "player2" ? 1 : 0),
      draws: rating1.draws + (isDraw ? 1 : 0),
      lastRatedAt: now,
    });

    await ctx.db.patch(rating2._id, {
      rating: result.player2.rating,
      ratingDeviation: result.player2.ratingDeviation,
      volatility: result.player2.volatility,
      wins: rating2.wins + (outcome === "player2" ? 1 : 0),
      losses: rating2.losses + (outcome === "player1" ? 1 : 0),
      draws: rating2.draws + (isDraw ? 1 : 0),
      lastRatedAt: now,
    });

    // Save rating history
    await ctx.db.insert("ratingHistory", {
      membershipId: args.player1MembershipId,
      leaderboardId: args.leaderboardId,
      matchId,
      rating: result.player1.rating,
      ratingDeviation: result.player1.ratingDeviation,
      volatility: result.player1.volatility,
      createdAt: now,
    });

    await ctx.db.insert("ratingHistory", {
      membershipId: args.player2MembershipId,
      leaderboardId: args.leaderboardId,
      matchId,
      rating: result.player2.rating,
      ratingDeviation: result.player2.ratingDeviation,
      volatility: result.player2.volatility,
      createdAt: now,
    });

    return { matchId };
  },
});
