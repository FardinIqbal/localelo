import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser, getOrCreateUser } from "./auth";

/**
 * Get current user (or null if not logged in)
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getUser(ctx);
  },
});

/**
 * Sync user from Clerk (called on first login or profile update)
 */
export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    return await getOrCreateUser(ctx);
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    await ctx.db.patch(user._id, {
      ...(args.firstName !== undefined && { firstName: args.firstName }),
      ...(args.lastName !== undefined && { lastName: args.lastName }),
      ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
    });

    return await ctx.db.get(user._id);
  },
});

/**
 * Clerk webhook handler - sync user data
 */
export const syncFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find existing user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
    });
  },
});
