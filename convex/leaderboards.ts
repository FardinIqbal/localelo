import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, getMembership, isOrgAdmin } from "./auth";
import { DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOLATILITY } from "./lib/glicko2";

/**
 * Get leaderboards in an organization
 */
export const byOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaderboards")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

/**
 * Get leaderboard by ID
 */
export const get = query({
  args: { id: v.id("leaderboards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new leaderboard (admin only)
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    sport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Check admin status
    if (!(await isOrgAdmin(ctx, user._id, args.organizationId))) {
      throw new Error("Not authorized");
    }

    // Create leaderboard
    const leaderboardId = await ctx.db.insert("leaderboards", {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      sport: args.sport,
    });

    // Add all approved members
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    for (const membership of memberships) {
      await ctx.db.insert("ratings", {
        leaderboardId,
        membershipId: membership._id,
        rating: DEFAULT_RATING,
        ratingDeviation: DEFAULT_RD,
        volatility: DEFAULT_VOLATILITY,
        wins: 0,
        losses: 0,
        draws: 0,
      });
    }

    return leaderboardId;
  },
});

/**
 * Get current user's rating on a leaderboard
 */
export const myRating = query({
  args: { leaderboardId: v.id("leaderboards") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const leaderboard = await ctx.db.get(args.leaderboardId);

    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    // Get membership
    const membership = await getMembership(ctx, user._id, leaderboard.organizationId);
    if (!membership) return null;

    // Get rating
    const rating = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard_membership", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("membershipId", membership._id)
      )
      .unique();

    return rating ? { ...rating, membershipId: membership._id } : null;
  },
});

/**
 * Join a leaderboard (if not already in it)
 */
export const join = mutation({
  args: { leaderboardId: v.id("leaderboards") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const leaderboard = await ctx.db.get(args.leaderboardId);

    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    // Get membership
    const membership = await getMembership(ctx, user._id, leaderboard.organizationId);
    if (!membership || membership.status !== "approved") {
      throw new Error("Not a member of this organization");
    }

    // Check if already has a rating
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_leaderboard_membership", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("membershipId", membership._id)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create rating
    return await ctx.db.insert("ratings", {
      leaderboardId: args.leaderboardId,
      membershipId: membership._id,
      rating: DEFAULT_RATING,
      ratingDeviation: DEFAULT_RD,
      volatility: DEFAULT_VOLATILITY,
      wins: 0,
      losses: 0,
      draws: 0,
    });
  },
});
