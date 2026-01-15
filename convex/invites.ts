import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, isOrgAdmin, getMembership } from "./auth";
import { DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOLATILITY } from "./lib/glicko2";

// Generate short invite code
function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create an invite link
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    maxUses: v.optional(v.number()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Check membership (any member can create invites)
    const membership = await getMembership(ctx, user._id, args.organizationId);
    if (!membership || membership.status !== "approved") {
      throw new Error("Not a member of this organization");
    }

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Calculate expiry (default 7 days)
    const expiresAt = args.expiresInDays
      ? Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    const inviteId = await ctx.db.insert("invites", {
      organizationId: args.organizationId,
      code,
      createdBy: user._id,
      maxUses: args.maxUses,
      uses: 0,
      expiresAt,
    });

    return { code, inviteId };
  },
});

/**
 * Validate an invite code
 */
export const validate = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!invite) {
      return { valid: false, error: "Invite not found" };
    }

    // Check expiry
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return { valid: false, error: "Invite expired" };
    }

    // Check uses
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return { valid: false, error: "Invite limit reached" };
    }

    const org = await ctx.db.get(invite.organizationId);
    if (!org) {
      return { valid: false, error: "Organization not found" };
    }

    return {
      valid: true,
      organization: {
        id: org._id,
        name: org.name,
        slug: org.slug,
        description: org.description,
      },
    };
  },
});

/**
 * Accept an invite (join org via invite code)
 */
export const accept = mutation({
  args: {
    code: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!invite) {
      throw new Error("Invite not found");
    }

    // Check expiry
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error("Invite expired");
    }

    // Check uses
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw new Error("Invite limit reached");
    }

    const org = await ctx.db.get(invite.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Check if already a member
    const existing = await getMembership(ctx, user._id, invite.organizationId);
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
        q.eq("organizationId", invite.organizationId).eq("username", args.username)
      )
      .unique();

    if (usernameExists) {
      throw new Error("Username already taken in this organization");
    }

    // Increment invite uses
    await ctx.db.patch(invite._id, { uses: invite.uses + 1 });

    // Create membership (auto-approved via invite)
    const membershipId = await ctx.db.insert("memberships", {
      organizationId: invite.organizationId,
      userId: user._id,
      username: args.username,
      status: "approved",
      isAdmin: false,
      isOwner: false,
    });

    // Add to all leaderboards
    const leaderboards = await ctx.db
      .query("leaderboards")
      .withIndex("by_org", (q) => q.eq("organizationId", invite.organizationId))
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

    return {
      membershipId,
      organization: {
        id: org._id,
        name: org.name,
        slug: org.slug,
      },
    };
  },
});

/**
 * List invites for an organization (admin only)
 */
export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!(await isOrgAdmin(ctx, user._id, args.organizationId))) {
      throw new Error("Not authorized");
    }

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Filter out expired invites
    const now = Date.now();
    return invites.filter((invite) => {
      if (invite.expiresAt && invite.expiresAt < now) return false;
      if (invite.maxUses && invite.uses >= invite.maxUses) return false;
      return true;
    });
  },
});

/**
 * Revoke an invite (admin only)
 */
export const revoke = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invite = await ctx.db.get(args.inviteId);

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (!(await isOrgAdmin(ctx, user._id, invite.organizationId))) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.inviteId);
    return { success: true };
  },
});
