import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  organizations,
  organizationMemberships,
  leaderboards,
  leaderboardRatings,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const organizationsRouter = router({
  // List all public organizations
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(organizations)
      .where(eq(organizations.visibility, "public"))
      .orderBy(desc(organizations.createdAt));
  }),

  // Get organization by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [org] = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return org;
    }),

  // Create organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        slug: z
          .string()
          .min(2)
          .max(50)
          .regex(/^[a-z0-9-]+$/),
        description: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        website: z.string().url().optional(),
        visibility: z.enum(["public", "private"]).default("public"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug exists
      const existing = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Organization slug already exists",
        });
      }

      // Create organization
      const [org] = await ctx.db
        .insert(organizations)
        .values({
          ...input,
          createdById: ctx.user.id,
        })
        .returning();

      // Create owner membership
      const [membership] = await ctx.db
        .insert(organizationMemberships)
        .values({
          organizationId: org.id,
          userId: ctx.user.id,
          username: ctx.user.firstName ?? ctx.user.email.split("@")[0],
          status: "approved",
          isOwner: true,
          isAdmin: true,
        })
        .returning();

      // Create default leaderboard
      const [defaultLeaderboard] = await ctx.db
        .insert(leaderboards)
        .values({
          organizationId: org.id,
          name: "Main Ladder",
          description: "Default ranking ladder",
        })
        .returning();

      // Add owner to default leaderboard
      await ctx.db.insert(leaderboardRatings).values({
        leaderboardId: defaultLeaderboard.id,
        membershipId: membership.id,
      });

      return org;
    }),

  // Join organization
  join: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        username: z.string().min(2).max(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if org exists
      const [org] = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check if already a member
      const existing = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, input.organizationId),
            eq(organizationMemberships.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member",
        });
      }

      // Check if username taken in org
      const usernameTaken = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, input.organizationId),
            eq(organizationMemberships.username, input.username)
          )
        )
        .limit(1);

      if (usernameTaken.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken in this organization",
        });
      }

      // Auto-approve for public orgs
      const status = org.visibility === "public" ? "approved" : "pending";

      const [membership] = await ctx.db
        .insert(organizationMemberships)
        .values({
          organizationId: input.organizationId,
          userId: ctx.user.id,
          username: input.username,
          status,
        })
        .returning();

      // If approved, add to all leaderboards
      if (status === "approved") {
        const orgLeaderboards = await ctx.db
          .select()
          .from(leaderboards)
          .where(eq(leaderboards.organizationId, input.organizationId));

        if (orgLeaderboards.length > 0) {
          await ctx.db.insert(leaderboardRatings).values(
            orgLeaderboards.map((lb) => ({
              leaderboardId: lb.id,
              membershipId: membership.id,
            }))
          );
        }
      }

      return membership;
    }),

  // Get user's organizations
  myOrganizations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        membership: organizationMemberships,
        organization: organizations,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id)
      )
      .where(eq(organizationMemberships.userId, ctx.user.id));
  }),

  // Get organization members
  members: publicProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, input.organizationId),
            eq(organizationMemberships.status, "approved")
          )
        )
        .orderBy(desc(organizationMemberships.createdAt));
    }),

  // Join organization by slug (for invite links)
  joinBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        username: z.string().min(2).max(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get org by slug
      const [org] = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Check if already a member
      const existing = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, org.id),
            eq(organizationMemberships.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Already a member - just return the org so we can redirect
        return { membership: existing[0], organization: org, alreadyMember: true };
      }

      // Check if username taken in org
      const usernameTaken = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, org.id),
            eq(organizationMemberships.username, input.username)
          )
        )
        .limit(1);

      if (usernameTaken.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      // Auto-approve for public orgs
      const status = org.visibility === "public" ? "approved" : "pending";

      const [membership] = await ctx.db
        .insert(organizationMemberships)
        .values({
          organizationId: org.id,
          userId: ctx.user.id,
          username: input.username,
          status,
        })
        .returning();

      // If approved, add to all leaderboards
      if (status === "approved") {
        const orgLeaderboards = await ctx.db
          .select()
          .from(leaderboards)
          .where(eq(leaderboards.organizationId, org.id));

        if (orgLeaderboards.length > 0) {
          await ctx.db.insert(leaderboardRatings).values(
            orgLeaderboards.map((lb) => ({
              leaderboardId: lb.id,
              membershipId: membership.id,
            }))
          );
        }
      }

      return { membership, organization: org, alreadyMember: false };
    }),
});
