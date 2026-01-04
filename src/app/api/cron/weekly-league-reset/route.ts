import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  weeklyLeagues,
  leagueMemberships,
  userXp,
} from "@/db/schema";
import { eq, and, gte, lt, desc, asc, sql } from "drizzle-orm";
import { LEAGUE_CONFIG, getNextTier, getPreviousTier } from "@/lib/xp-calculator";

// Vercel Cron: Run every Monday at 00:00 UTC
// Add to vercel.json: { "crons": [{ "path": "/api/cron/weekly-league-reset", "schedule": "0 0 * * 1" }] }

export async function GET(request: NextRequest) {
  // Verify cron secret (set CRON_SECRET in Vercel env)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Get the week that just ended
    const weekEnd = new Date(now);
    weekEnd.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get all active leagues for the ended week
    const endedLeagues = await db.query.weeklyLeagues.findMany({
      where: and(
        gte(weeklyLeagues.weekStart, weekStart),
        lt(weeklyLeagues.weekEnd, weekEnd)
      ),
    });

    let promotions = 0;
    let demotions = 0;
    let newLeagues = 0;

    for (const league of endedLeagues) {
      // Get all memberships for this league, sorted by XP
      const memberships = await db
        .select()
        .from(leagueMemberships)
        .where(eq(leagueMemberships.leagueId, league.id))
        .orderBy(desc(leagueMemberships.weeklyXp));

      if (memberships.length === 0) continue;

      const tierConfig = LEAGUE_CONFIG[league.tier];
      const totalMembers = memberships.length;

      // Calculate promotion/demotion cutoffs using correct property names
      const promoteCount = Math.floor(
        totalMembers * (tierConfig.promoteTop / 100)
      );
      const demoteCount = Math.floor(
        totalMembers * (tierConfig.demoteBottom / 100)
      );

      const nextTier = getNextTier(league.tier);
      const prevTier = getPreviousTier(league.tier);

      // Process each member
      for (let i = 0; i < memberships.length; i++) {
        const membership = memberships[i];
        const rank = i + 1;

        let promoted = false;
        let demoted = false;
        let newTier = league.tier;

        // Check for promotion (top performers)
        if (rank <= promoteCount && nextTier) {
          promoted = true;
          newTier = nextTier;
          promotions++;
        }
        // Check for demotion (bottom performers)
        else if (rank > totalMembers - demoteCount && prevTier) {
          demoted = true;
          newTier = prevTier;
          demotions++;
        }

        // Update league membership with final rank
        await db
          .update(leagueMemberships)
          .set({
            finalRank: rank,
            promoted,
            demoted,
          })
          .where(eq(leagueMemberships.id, membership.id));

        // Update user's tier in userXp
        if (promoted || demoted) {
          await db
            .update(userXp)
            .set({
              currentTier: newTier,
              weeklyXp: 0, // Reset weekly XP
            })
            .where(eq(userXp.userId, membership.userId));
        } else {
          // Just reset weekly XP
          await db
            .update(userXp)
            .set({ weeklyXp: 0 })
            .where(eq(userXp.userId, membership.userId));
        }
      }
    }

    // Create new leagues for the upcoming week
    const newWeekStart = new Date(weekEnd);
    const newWeekEnd = new Date(newWeekStart);
    newWeekEnd.setDate(newWeekEnd.getDate() + 7);

    // Get all users with XP data
    const allUserXp = await db.query.userXp.findMany();

    // Group users by tier
    const usersByTier: Record<string, typeof allUserXp> = {};
    for (const user of allUserXp) {
      if (!usersByTier[user.currentTier]) {
        usersByTier[user.currentTier] = [];
      }
      usersByTier[user.currentTier].push(user);
    }

    // Create leagues for each tier (max 30 users per league)
    const LEAGUE_SIZE = 30;

    for (const [tier, users] of Object.entries(usersByTier)) {
      // Shuffle users randomly
      const shuffled = [...users].sort(() => Math.random() - 0.5);

      // Create leagues with up to 30 users each
      for (let i = 0; i < shuffled.length; i += LEAGUE_SIZE) {
        const leagueUsers = shuffled.slice(i, i + LEAGUE_SIZE);

        // Create the league
        const [newLeague] = await db
          .insert(weeklyLeagues)
          .values({
            tier: tier as typeof weeklyLeagues.$inferInsert.tier,
            weekStart: newWeekStart,
            weekEnd: newWeekEnd,
          })
          .returning();

        // Add users to the league
        for (const user of leagueUsers) {
          await db.insert(leagueMemberships).values({
            leagueId: newLeague.id,
            userId: user.userId,
            weeklyXp: 0,
          });
        }

        newLeagues++;
      }
    }

    return NextResponse.json({
      success: true,
      processedLeagues: endedLeagues.length,
      promotions,
      demotions,
      newLeaguesCreated: newLeagues,
    });
  } catch (error) {
    console.error("Weekly league reset error:", error);
    return NextResponse.json(
      { error: "Failed to process weekly reset" },
      { status: 500 }
    );
  }
}
