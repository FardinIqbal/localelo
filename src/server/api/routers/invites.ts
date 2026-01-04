import { z } from "zod";
import { eq, and, gt, or, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  organizationInvites,
  organizations,
  organizationMemberships,
  users,
  leaderboards,
  leaderboardRatings,
} from "@/db/schema";
import { nanoid } from "nanoid";

// Generate a short, URL-safe invite code
function generateInviteCode(): string {
  return nanoid(8);
}

export const invitesRouter = router({
  // Create a new invite link
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        maxUses: z.number().int().positive().optional(),
        expiresInDays: z.number().int().positive().optional().default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is admin/owner of the org
      const membership = await ctx.db.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.organizationId, input.organizationId),
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to create invite links",
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const [invite] = await ctx.db
        .insert(organizationInvites)
        .values({
          organizationId: input.organizationId,
          code: generateInviteCode(),
          createdById: ctx.user.id,
          maxUses: input.maxUses,
          expiresAt,
        })
        .returning();

      return invite;
    }),

  // Validate an invite code (public - for landing page)
  validate: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: eq(organizationInvites.code, input.code),
        with: {
          organization: true,
          createdBy: true,
        },
      });

      if (!invite) {
        return { valid: false, error: "Invalid invite link" };
      }

      // Check expiration
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return { valid: false, error: "This invite has expired" };
      }

      // Check max uses
      if (invite.maxUses && invite.uses >= invite.maxUses) {
        return { valid: false, error: "This invite has reached its limit" };
      }

      // Get member count
      const memberCount = await ctx.db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, invite.organizationId),
            eq(organizationMemberships.status, "approved")
          )
        );

      return {
        valid: true,
        organization: {
          id: invite.organization.id,
          name: invite.organization.name,
          slug: invite.organization.slug,
          imageUrl: invite.organization.imageUrl,
          memberCount: memberCount.length,
        },
        invitedBy: invite.createdBy
          ? {
              firstName: invite.createdBy.firstName,
              imageUrl: invite.createdBy.imageUrl,
            }
          : null,
      };
    }),

  // Accept an invite (must be logged in)
  accept: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        username: z.string().min(2).max(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: eq(organizationInvites.code, input.code),
        with: {
          organization: true,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite link",
        });
      }

      // Check expiration
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has expired",
        });
      }

      // Check max uses
      if (invite.maxUses && invite.uses >= invite.maxUses) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has reached its limit",
        });
      }

      // Check if already a member
      const existingMembership =
        await ctx.db.query.organizationMemberships.findFirst({
          where: and(
            eq(organizationMemberships.organizationId, invite.organizationId),
            eq(organizationMemberships.userId, ctx.user.id)
          ),
        });

      if (existingMembership) {
        return {
          alreadyMember: true,
          organization: invite.organization,
        };
      }

      // Check username uniqueness within org
      const existingUsername =
        await ctx.db.query.organizationMemberships.findFirst({
          where: and(
            eq(organizationMemberships.organizationId, invite.organizationId),
            eq(organizationMemberships.username, input.username)
          ),
        });

      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This username is already taken in this organization",
        });
      }

      // Create membership (auto-approved since they have invite)
      const [membership] = await ctx.db
        .insert(organizationMemberships)
        .values({
          organizationId: invite.organizationId,
          userId: ctx.user.id,
          username: input.username,
          status: "approved",
        })
        .returning();

      // Increment invite uses
      await ctx.db
        .update(organizationInvites)
        .set({ uses: invite.uses + 1 })
        .where(eq(organizationInvites.id, invite.id));

      // Auto-add to all leaderboards
      const orgLeaderboards = await ctx.db.query.leaderboards.findMany({
        where: eq(leaderboards.organizationId, invite.organizationId),
      });

      if (orgLeaderboards.length > 0) {
        await ctx.db.insert(leaderboardRatings).values(
          orgLeaderboards.map((lb) => ({
            leaderboardId: lb.id,
            membershipId: membership.id,
          }))
        );
      }

      return {
        alreadyMember: false,
        organization: invite.organization,
        membership,
      };
    }),

  // Get active invites for an org (admin only)
  list: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify admin
      const membership = await ctx.db.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.organizationId, input.organizationId),
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        ),
      });

      if (!membership || (!membership.isAdmin && !membership.isOwner)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view invite links",
        });
      }

      const invites = await ctx.db.query.organizationInvites.findMany({
        where: and(
          eq(organizationInvites.organizationId, input.organizationId),
          or(
            isNull(organizationInvites.expiresAt),
            gt(organizationInvites.expiresAt, new Date())
          )
        ),
        with: {
          createdBy: true,
        },
        orderBy: (invites, { desc }) => [desc(invites.createdAt)],
      });

      return invites;
    }),

  // Revoke an invite
  revoke: protectedProcedure
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: eq(organizationInvites.id, input.inviteId),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });
      }

      // Verify admin
      const membership = await ctx.db.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.organizationId, invite.organizationId),
          eq(organizationMemberships.userId, ctx.user.id),
          eq(organizationMemberships.status, "approved")
        ),
      });

      if (!membership || (!membership.isAdmin && !membership.isOwner)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can revoke invite links",
        });
      }

      await ctx.db
        .delete(organizationInvites)
        .where(eq(organizationInvites.id, input.inviteId));

      return { success: true };
    }),
});
