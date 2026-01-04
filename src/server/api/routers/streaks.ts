import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { userStreaks, dailyActivity, users } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  calculateStreakUpdate,
  calculateFreezesEarned,
  isStreakAtRisk,
} from "@/lib/streak-utils";
import { startOfDay, subDays } from "date-fns";

export const streaksRouter = router({
  // Get current user's streak data
  getMyStreak: protectedProcedure.query(async ({ ctx }) => {
    // Get or create streak record
    let [streak] = await ctx.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, ctx.user.id))
      .limit(1);

    if (!streak) {
      // Create initial streak record
      [streak] = await ctx.db
        .insert(userStreaks)
        .values({
          userId: ctx.user.id,
          currentStreak: 0,
          longestStreak: 0,
          freezesAvailable: 0,
          weekendAmuletActive: true, // Start with amulet active
        })
        .returning();
    }

    const atRisk = isStreakAtRisk(streak.lastActivityDate);

    return {
      ...streak,
      atRisk,
    };
  }),

  // Record daily activity (called when user logs a match)
  recordActivity: protectedProcedure
    .input(
      z.object({
        xpEarned: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const today = startOfDay(new Date());

      // Get current streak
      let [streak] = await ctx.db
        .select()
        .from(userStreaks)
        .where(eq(userStreaks.userId, ctx.user.id))
        .limit(1);

      if (!streak) {
        [streak] = await ctx.db
          .insert(userStreaks)
          .values({
            userId: ctx.user.id,
            currentStreak: 0,
            longestStreak: 0,
            freezesAvailable: 0,
            weekendAmuletActive: true,
          })
          .returning();
      }

      // Calculate streak update
      const streakUpdate = calculateStreakUpdate({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
        freezesAvailable: streak.freezesAvailable,
        weekendAmuletActive: streak.weekendAmuletActive,
      });

      // Calculate freezes earned
      const freezesEarned = calculateFreezesEarned(
        streakUpdate.newStreak,
        streak.freezesAvailable
      );

      // Update streak record
      const newLongestStreak = Math.max(
        streak.longestStreak,
        streakUpdate.newStreak
      );
      const newFreezes = streakUpdate.freezeUsed
        ? streak.freezesAvailable - 1 + freezesEarned
        : streak.freezesAvailable + freezesEarned;

      await ctx.db
        .update(userStreaks)
        .set({
          currentStreak: streakUpdate.newStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: new Date(),
          freezesAvailable: Math.min(2, Math.max(0, newFreezes)),
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.id, streak.id));

      // Update or create daily activity record
      const [existingActivity] = await ctx.db
        .select()
        .from(dailyActivity)
        .where(
          and(
            eq(dailyActivity.userId, ctx.user.id),
            eq(dailyActivity.activityDate, today)
          )
        )
        .limit(1);

      if (existingActivity) {
        await ctx.db
          .update(dailyActivity)
          .set({
            matchesPlayed: existingActivity.matchesPlayed + 1,
            xpEarned: existingActivity.xpEarned + input.xpEarned,
          })
          .where(eq(dailyActivity.id, existingActivity.id));
      } else {
        await ctx.db.insert(dailyActivity).values({
          userId: ctx.user.id,
          activityDate: today,
          matchesPlayed: 1,
          xpEarned: input.xpEarned,
        });
      }

      return {
        streak: streakUpdate.newStreak,
        longestStreak: newLongestStreak,
        freezeUsed: streakUpdate.freezeUsed,
        amuletUsed: streakUpdate.amuletUsed,
        milestoneReached: streakUpdate.milestoneReached,
        streakBroken: streakUpdate.streakBroken,
        freezesAvailable: newFreezes,
      };
    }),

  // Use a freeze manually (for protection before it expires)
  useFreeze: protectedProcedure.mutation(async ({ ctx }) => {
    const [streak] = await ctx.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, ctx.user.id))
      .limit(1);

    if (!streak) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No streak record found",
      });
    }

    if (streak.freezesAvailable <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No freezes available",
      });
    }

    // Can only use freeze if at risk
    if (!isStreakAtRisk(streak.lastActivityDate)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Streak is not at risk",
      });
    }

    await ctx.db
      .update(userStreaks)
      .set({
        freezesAvailable: streak.freezesAvailable - 1,
        lastActivityDate: new Date(), // Extend the streak
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.id, streak.id));

    return {
      success: true,
      freezesRemaining: streak.freezesAvailable - 1,
    };
  }),

  // Toggle weekend amulet
  toggleWeekendAmulet: protectedProcedure.mutation(async ({ ctx }) => {
    const [streak] = await ctx.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, ctx.user.id))
      .limit(1);

    if (!streak) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No streak record found",
      });
    }

    await ctx.db
      .update(userStreaks)
      .set({
        weekendAmuletActive: !streak.weekendAmuletActive,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.id, streak.id));

    return {
      weekendAmuletActive: !streak.weekendAmuletActive,
    };
  }),

  // Get activity history
  getActivityHistory: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = startOfDay(subDays(new Date(), input.days));

      const activities = await ctx.db
        .select()
        .from(dailyActivity)
        .where(
          and(
            eq(dailyActivity.userId, ctx.user.id),
            gte(dailyActivity.activityDate, startDate)
          )
        )
        .orderBy(desc(dailyActivity.activityDate));

      return activities;
    }),

  // Leaderboard of top streaks
  streakLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const topStreaks = await ctx.db
        .select({
          streak: userStreaks,
          user: users,
        })
        .from(userStreaks)
        .innerJoin(users, eq(userStreaks.userId, users.id))
        .orderBy(desc(userStreaks.currentStreak))
        .limit(input.limit);

      return topStreaks.map((entry, index) => ({
        rank: index + 1,
        userId: entry.user.id,
        firstName: entry.user.firstName,
        lastName: entry.user.lastName,
        imageUrl: entry.user.imageUrl,
        currentStreak: entry.streak.currentStreak,
        longestStreak: entry.streak.longestStreak,
      }));
    }),
});
