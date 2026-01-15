import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, getMembership } from "./auth";
import { DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOLATILITY } from "./lib/glicko2";

/**
 * Join an organization
 */
export const join = mutation({
  args: {
    organizationId: v.id("organizations"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const org = await ctx.db.get(args.organizationId);

    if (!org) {
      throw new Error("Organization not found");
    }

    // Check if already a member
    const existing = await getMembership(ctx, user._id, args.organizationId);
    if (existing) {
      if (existing.status === "banned") {
        throw new Error("You are banned from this organization");
      }
      return existing._id;
    }

    // Check username uniqueness in org
    const usernameExists = await ctx.db
      .query("memberships")
      .withIndex("by_org_username", (q) =>
        q.eq("organizationId", args.organizationId).eq("username", args.username)
      )
      .unique();

    if (usernameExists) {
      throw new Error("Username already taken in this organization");
    }

    // Create membership (auto-approve for public orgs)
    const membershipId = await ctx.db.insert("memberships", {
      organizationId: args.organizationId,
      userId: user._id,
      username: args.username,
      status: org.visibility === "public" ? "approved" : "pending",
      isAdmin: false,
      isOwner: false,
    });

    // Add to all leaderboards if approved
    if (org.visibility === "public") {
      const leaderboards = await ctx.db
        .query("leaderboards")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect();

      for (const lb of leaderboards) {
        await ctx.db.insert("ratings", {
          leaderboardId: lb._id,
          membershipId,
          rating: DEFAULT_RATING,
          ratingDeviation: DEFAULT_RD,
          volatility: DEFAULT_VOLATILITY,
          wins: 0,
          losses: 0,
          draws: 0,
        });
      }
    }

    return membershipId;
  },
});

/**
 * Join organization by slug
 */
export const joinBySlug = mutation({
  args: {
    slug: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!org) {
      throw new Error("Organization not found");
    }

    const user = await requireUser(ctx);

    // Check if already a member
    const existing = await getMembership(ctx, user._id, org._id);
    if (existing) {
      if (existing.status === "banned") {
        throw new Error("You are banned from this organization");
      }
      return existing._id;
    }

    // Check username uniqueness
    const usernameExists = await ctx.db
      .query("memberships")
      .withIndex("by_org_username", (q) =>
        q.eq("organizationId", org._id).eq("username", args.username)
      )
      .unique();

    if (usernameExists) {
      throw new Error("Username already taken in this organization");
    }

    // Create membership
    const membershipId = await ctx.db.insert("memberships", {
      organizationId: org._id,
      userId: user._id,
      username: args.username,
      status: org.visibility === "public" ? "approved" : "pending",
      isAdmin: false,
      isOwner: false,
    });

    // Add to all leaderboards if approved
    if (org.visibility === "public") {
      const leaderboards = await ctx.db
        .query("leaderboards")
        .withIndex("by_org", (q) => q.eq("organizationId", org._id))
        .collect();

      for (const lb of leaderboards) {
        await ctx.db.insert("ratings", {
          leaderboardId: lb._id,
          membershipId,
          rating: DEFAULT_RATING,
          ratingDeviation: DEFAULT_RD,
          volatility: DEFAULT_VOLATILITY,
          wins: 0,
          losses: 0,
          draws: 0,
        });
      }
    }

    return membershipId;
  },
});

/**
 * Get membership for current user in an organization
 */
export const myMembership = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await getMembership(ctx, user._id, args.organizationId);
  },
});

/**
 * Approve a pending membership (admin only)
 */
export const approve = mutation({
  args: { membershipId: v.id("memberships") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const membership = await ctx.db.get(args.membershipId);

    if (!membership) {
      throw new Error("Membership not found");
    }

    // Check if current user is admin
    const myMembership = await getMembership(
      ctx,
      user._id,
      membership.organizationId
    );
    if (!myMembership?.isAdmin && !myMembership?.isOwner) {
      throw new Error("Not authorized");
    }

    // Approve membership
    await ctx.db.patch(args.membershipId, { status: "approved" });

    // Add to all leaderboards
    const leaderboards = await ctx.db
      .query("leaderboards")
      .withIndex("by_org", (q) => q.eq("organizationId", membership.organizationId))
      .collect();

    for (const lb of leaderboards) {
      // Check if already has a rating
      const existing = await ctx.db
        .query("ratings")
        .withIndex("by_leaderboard_membership", (q) =>
          q.eq("leaderboardId", lb._id).eq("membershipId", args.membershipId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("ratings", {
          leaderboardId: lb._id,
          membershipId: args.membershipId,
          rating: DEFAULT_RATING,
          ratingDeviation: DEFAULT_RD,
          volatility: DEFAULT_VOLATILITY,
          wins: 0,
          losses: 0,
          draws: 0,
        });
      }
    }

    return membership;
  },
});
