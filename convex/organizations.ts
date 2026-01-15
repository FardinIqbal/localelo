import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";
import { DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOLATILITY } from "./lib/glicko2";

/**
 * List all public organizations
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("visibility"), "public"))
      .collect();
  },
});

/**
 * Get organization by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get organization by ID
 */
export const get = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create new organization
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("Organization slug already exists");
    }

    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      location: args.location,
      visibility: args.visibility ?? "public",
      createdBy: user._id,
    });

    // Create membership as owner
    const membershipId = await ctx.db.insert("memberships", {
      organizationId: orgId,
      userId: user._id,
      username: user.firstName ?? user.email.split("@")[0],
      status: "approved",
      isAdmin: true,
      isOwner: true,
    });

    // Create default leaderboard
    const leaderboardId = await ctx.db.insert("leaderboards", {
      organizationId: orgId,
      name: "Main",
      description: "Default leaderboard",
    });

    // Add owner to default leaderboard
    await ctx.db.insert("ratings", {
      leaderboardId,
      membershipId,
      rating: DEFAULT_RATING,
      ratingDeviation: DEFAULT_RD,
      volatility: DEFAULT_VOLATILITY,
      wins: 0,
      losses: 0,
      draws: 0,
    });

    return orgId;
  },
});

/**
 * Get user's organizations with stats
 */
export const myOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        if (!org) return null;

        // Get user's best rating in this org
        const leaderboards = await ctx.db
          .query("leaderboards")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .collect();

        let bestRating = null;
        let bestRank = null;

        for (const lb of leaderboards) {
          const rating = await ctx.db
            .query("ratings")
            .withIndex("by_leaderboard_membership", (q) =>
              q.eq("leaderboardId", lb._id).eq("membershipId", membership._id)
            )
            .unique();

          if (rating) {
            // Get rank
            const allRatings = await ctx.db
              .query("ratings")
              .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", lb._id))
              .collect();

            const sorted = allRatings.sort((a, b) => b.rating - a.rating);
            const rank = sorted.findIndex((r) => r._id === rating._id) + 1;

            if (!bestRating || rating.rating > bestRating) {
              bestRating = rating.rating;
              bestRank = rank;
            }
          }
        }

        return {
          organizationId: org._id,
          name: org.name,
          slug: org.slug,
          role: membership.isOwner
            ? "Owner"
            : membership.isAdmin
              ? "Admin"
              : "Member",
          rank: bestRank,
          rating: bestRating,
        };
      })
    );

    return results.filter(Boolean);
  },
});

/**
 * Get members of an organization
 */
export const members = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          user,
        };
      })
    );
  },
});
