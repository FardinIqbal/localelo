import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  weeklyLeagues,
  leagueMemberships,
  userXp,
  users,
} from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  LEAGUE_CONFIG,
  getLeagueWeekDates,
  getTierFromXp,
  type LeagueTier,
} from "@/lib/xp-calculator";

export const leaguesRouter = router({
  // Get current user's XP and tier info
  getMyXp: protectedProcedure.query(async ({ ctx }) => {
    let [xpRecord] = await ctx.db
      .select()
      .from(userXp)
      .where(eq(userXp.userId, ctx.user.id))
      .limit(1);

    if (!xpRecord) {
      // Create initial XP record
      [xpRecord] = await ctx.db
        .insert(userXp)
        .values({
          userId: ctx.user.id,
          totalXp: 0,
          weeklyXp: 0,
          currentTier: "bronze",
        })
        .returning();
    }

    const tierConfig = LEAGUE_CONFIG[xpRecord.currentTier as LeagueTier];

    return {
      ...xpRecord,
      tierConfig,
    };
  }),

  // Get current week's league and user's standing
  getCurrentLeague: protectedProcedure.query(async ({ ctx }) => {
    // Get user's tier
    let [xpRecord] = await ctx.db
      .select()
      .from(userXp)
      .where(eq(userXp.userId, ctx.user.id))
      .limit(1);

    if (!xpRecord) {
      [xpRecord] = await ctx.db
        .insert(userXp)
        .values({
          userId: ctx.user.id,
          totalXp: 0,
          weeklyXp: 0,
          currentTier: "bronze",
        })
        .returning();
    }

    const { start, end } = getLeagueWeekDates();
    const tier = xpRecord.currentTier as LeagueTier;

    // Find or create current week's league for user's tier
    let [league] = await ctx.db
      .select()
      .from(weeklyLeagues)
      .where(
        and(
          eq(weeklyLeagues.tier, tier),
          gte(weeklyLeagues.weekStart, start),
          lte(weeklyLeagues.weekEnd, end)
        )
      )
      .limit(1);

    if (!league) {
      // Create new league for this tier and week
      [league] = await ctx.db
        .insert(weeklyLeagues)
        .values({
          tier,
          weekStart: start,
          weekEnd: end,
        })
        .returning();
    }

    // Check if user is in this league
    let [membership] = await ctx.db
      .select()
      .from(leagueMemberships)
      .where(
        and(
          eq(leagueMemberships.leagueId, league.id),
          eq(leagueMemberships.userId, ctx.user.id)
        )
      )
      .limit(1);

    if (!membership) {
      // Join the league
      [membership] = await ctx.db
        .insert(leagueMemberships)
        .values({
          leagueId: league.id,
          userId: ctx.user.id,
          weeklyXp: 0,
        })
        .returning();
    }

    // Get all participants in this league for standings
    const participants = await ctx.db
      .select({
        membership: leagueMemberships,
        user: users,
      })
      .from(leagueMemberships)
      .innerJoin(users, eq(leagueMemberships.userId, users.id))
      .where(eq(leagueMemberships.leagueId, league.id))
      .orderBy(desc(leagueMemberships.weeklyXp));

    // Find user's rank
    const userRank =
      participants.findIndex((p) => p.user.id === ctx.user.id) + 1;

    // Calculate promotion/demotion zones
    const config = LEAGUE_CONFIG[tier];
    const participantCount = participants.length;
    const promoteCount = Math.floor(
      (participantCount * config.promoteTop) / 100
    );
    const demoteCount = Math.floor(
      (participantCount * config.demoteBottom) / 100
    );

    // Determine user's zone
    let zone: "promote" | "safe" | "demote" | "none" = "safe";
    if (config.promoteTop > 0 && userRank <= promoteCount) {
      zone = "promote";
    } else if (
      config.demoteBottom > 0 &&
      userRank > participantCount - demoteCount
    ) {
      zone = "demote";
    }

    return {
      league,
      membership,
      tier,
      tierConfig: config,
      userRank,
      participantCount,
      promoteCount,
      demoteCount,
      zone,
      weekStart: start,
      weekEnd: end,
      participants: participants.slice(0, 30).map((p, index) => ({
        rank: index + 1,
        userId: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        imageUrl: p.user.imageUrl,
        weeklyXp: p.membership.weeklyXp,
        isCurrentUser: p.user.id === ctx.user.id,
      })),
    };
  }),

  // Add XP to user (called after match)
  addXp: protectedProcedure
    .input(
      z.object({
        xpAmount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get or create user XP record
      let [xpRecord] = await ctx.db
        .select()
        .from(userXp)
        .where(eq(userXp.userId, ctx.user.id))
        .limit(1);

      if (!xpRecord) {
        [xpRecord] = await ctx.db
          .insert(userXp)
          .values({
            userId: ctx.user.id,
            totalXp: input.xpAmount,
            weeklyXp: input.xpAmount,
            currentTier: "bronze",
          })
          .returning();
      } else {
        // Update XP
        const newTotalXp = xpRecord.totalXp + input.xpAmount;
        const newWeeklyXp = xpRecord.weeklyXp + input.xpAmount;
        const newTier = getTierFromXp(newTotalXp);

        await ctx.db
          .update(userXp)
          .set({
            totalXp: newTotalXp,
            weeklyXp: newWeeklyXp,
            currentTier: newTier,
            updatedAt: new Date(),
          })
          .where(eq(userXp.id, xpRecord.id));

        xpRecord = {
          ...xpRecord,
          totalXp: newTotalXp,
          weeklyXp: newWeeklyXp,
          currentTier: newTier,
        };
      }

      // Update league membership XP
      const { start, end } = getLeagueWeekDates();

      const [league] = await ctx.db
        .select()
        .from(weeklyLeagues)
        .where(
          and(
            eq(weeklyLeagues.tier, xpRecord.currentTier as LeagueTier),
            gte(weeklyLeagues.weekStart, start),
            lte(weeklyLeagues.weekEnd, end)
          )
        )
        .limit(1);

      if (league) {
        const [membership] = await ctx.db
          .select()
          .from(leagueMemberships)
          .where(
            and(
              eq(leagueMemberships.leagueId, league.id),
              eq(leagueMemberships.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (membership) {
          await ctx.db
            .update(leagueMemberships)
            .set({
              weeklyXp: membership.weeklyXp + input.xpAmount,
              updatedAt: new Date(),
            })
            .where(eq(leagueMemberships.id, membership.id));
        }
      }

      return {
        totalXp: xpRecord.totalXp,
        weeklyXp: xpRecord.weeklyXp,
        currentTier: xpRecord.currentTier,
        tierConfig: LEAGUE_CONFIG[xpRecord.currentTier as LeagueTier],
      };
    }),

  // Get league history (past weeks)
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(52).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { start } = getLeagueWeekDates();

      const history = await ctx.db
        .select({
          league: weeklyLeagues,
          membership: leagueMemberships,
        })
        .from(leagueMemberships)
        .innerJoin(
          weeklyLeagues,
          eq(leagueMemberships.leagueId, weeklyLeagues.id)
        )
        .where(
          and(
            eq(leagueMemberships.userId, ctx.user.id),
            lte(weeklyLeagues.weekEnd, start) // Past weeks only
          )
        )
        .orderBy(desc(weeklyLeagues.weekStart))
        .limit(input.limit);

      return history.map((h) => ({
        weekStart: h.league.weekStart,
        weekEnd: h.league.weekEnd,
        tier: h.league.tier,
        weeklyXp: h.membership.weeklyXp,
        finalRank: h.membership.finalRank,
        promoted: h.membership.promoted,
        demoted: h.membership.demoted,
      }));
    }),
});
