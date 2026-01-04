import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  userStreaks,
  notificationPreferences,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Vercel Cron: Run every hour to catch users at their preferred reminder time
// Add to vercel.json: { "crons": [{ "path": "/api/cron/streak-reminders", "schedule": "0 * * * *" }] }

// Note: For actual push notifications, you'll need to:
// 1. Install web-push: npm install web-push
// 2. Generate VAPID keys: npx web-push generate-vapid-keys
// 3. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel env
// 4. Uncomment the web-push code below

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentHour = now.getUTCHours();

    // Find users who:
    // 1. Have streak reminders enabled
    // 2. Haven't logged activity today
    // 3. Have a streak to protect
    // 4. Current hour matches their reminder time

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get all notification preferences with streak reminders enabled
    const prefsWithReminders = await db.query.notificationPreferences.findMany({
      where: and(
        eq(notificationPreferences.pushEnabled, true),
        eq(notificationPreferences.streakReminders, true)
      ),
    });

    let eligibleCount = 0;
    const usersToNotify: Array<{
      userId: string;
      streak: number;
      atRisk: boolean;
    }> = [];

    for (const pref of prefsWithReminders) {
      // Check if it's the user's preferred reminder time
      const reminderTime = pref.reminderTime || "18:00";
      const [reminderHour] = reminderTime.split(":").map(Number);

      if (reminderHour !== currentHour) continue;

      // Get user's streak
      const streak = await db.query.userStreaks.findFirst({
        where: eq(userStreaks.userId, pref.userId),
      });

      // Skip if no streak or streak is 0
      if (!streak || streak.currentStreak === 0) continue;

      // Check if user already logged activity today
      if (
        streak.lastActivityDate &&
        new Date(streak.lastActivityDate) >= today
      ) {
        continue;
      }

      // This user needs a notification
      eligibleCount++;
      usersToNotify.push({
        userId: pref.userId,
        streak: streak.currentStreak,
        atRisk: true,
      });

      // In a production implementation, you would send push notifications here
      // using web-push or a service like Firebase Cloud Messaging, OneSignal, etc.
      //
      // Example with web-push (uncomment after installing):
      // const subscription = await db.query.pushSubscriptions.findFirst({
      //   where: eq(pushSubscriptions.userId, pref.userId),
      // });
      // if (subscription) {
      //   await webpush.sendNotification(
      //     { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      //     JSON.stringify({ title: "Streak at risk!", body: `Log a match to protect your ${streak.currentStreak}-day streak!` })
      //   );
      // }
    }

    // For now, just log the users who would receive notifications
    // In production, integrate with your push notification service
    console.log(`Streak reminders: ${eligibleCount} users eligible at hour ${currentHour}`);

    return NextResponse.json({
      success: true,
      eligibleUsers: eligibleCount,
      hour: currentHour,
      // Include user IDs for debugging (remove in production)
      users: usersToNotify.slice(0, 10), // Only return first 10 for safety
    });
  } catch (error) {
    console.error("Streak reminder error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
