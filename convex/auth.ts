import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get the current authenticated user from Clerk identity
 */
export async function getUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/**
 * Get the current user, throwing if not authenticated
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

/**
 * Get or create user from Clerk identity (for first-time login)
 */
export async function getOrCreateUser(
  ctx: MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Check if user exists
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    email: identity.email ?? "",
    firstName: identity.givenName ?? undefined,
    lastName: identity.familyName ?? undefined,
    imageUrl: identity.pictureUrl ?? undefined,
  });

  const newUser = await ctx.db.get(userId);
  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser;
}

/**
 * Check if user is admin or owner of an organization
 */
export async function isOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations">
): Promise<boolean> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId)
    )
    .unique();

  if (!membership) return false;
  return membership.isAdmin || membership.isOwner;
}

/**
 * Get user's membership in an organization
 */
export async function getMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations">
): Promise<Doc<"memberships"> | null> {
  return await ctx.db
    .query("memberships")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId)
    )
    .unique();
}
