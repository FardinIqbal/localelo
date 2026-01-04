import { startOfDay, differenceInDays, isWeekend, subDays } from "date-fns";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  freezesAvailable: number;
  weekendAmuletActive: boolean;
}

export interface StreakUpdateResult {
  newStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  amuletUsed: boolean;
  milestoneReached: number | null;
}

// Streak milestones that trigger celebrations
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365];

// Streak color progression based on days
export function getStreakColor(streak: number): string {
  if (streak === 0) return "gray";
  if (streak < 3) return "orange";
  if (streak < 7) return "orange";
  if (streak < 14) return "red";
  if (streak < 30) return "purple";
  return "gold";
}

// Get streak tier name
export function getStreakTier(streak: number): string {
  if (streak === 0) return "None";
  if (streak < 3) return "Starting";
  if (streak < 7) return "Building";
  if (streak < 14) return "On Fire";
  if (streak < 30) return "Blazing";
  if (streak < 100) return "Legendary";
  return "Immortal";
}

// Check if streak is at risk (no activity yet today)
export function isStreakAtRisk(lastActivityDate: Date | null): boolean {
  if (!lastActivityDate) return false;
  const today = startOfDay(new Date());
  const lastActivity = startOfDay(lastActivityDate);
  return differenceInDays(today, lastActivity) >= 1;
}

// Calculate streak update when user logs activity
export function calculateStreakUpdate(
  streakData: StreakData,
  activityDate: Date = new Date()
): StreakUpdateResult {
  const today = startOfDay(activityDate);
  const lastActivity = streakData.lastActivityDate
    ? startOfDay(streakData.lastActivityDate)
    : null;

  // First activity ever
  if (!lastActivity) {
    return {
      newStreak: 1,
      streakBroken: false,
      freezeUsed: false,
      amuletUsed: false,
      milestoneReached: null,
    };
  }

  const daysDifference = differenceInDays(today, lastActivity);

  // Already logged today
  if (daysDifference === 0) {
    return {
      newStreak: streakData.currentStreak,
      streakBroken: false,
      freezeUsed: false,
      amuletUsed: false,
      milestoneReached: null,
    };
  }

  // Consecutive day - streak continues
  if (daysDifference === 1) {
    const newStreak = streakData.currentStreak + 1;
    const milestone = STREAK_MILESTONES.includes(newStreak) ? newStreak : null;
    return {
      newStreak,
      streakBroken: false,
      freezeUsed: false,
      amuletUsed: false,
      milestoneReached: milestone,
    };
  }

  // Missed one or more days - check for protection
  let freezeUsed = false;
  let amuletUsed = false;
  let streakBroken = true;
  let newStreak = 1;

  // Check if weekend amulet applies (only for weekend days missed)
  if (streakData.weekendAmuletActive && daysDifference <= 2) {
    // Check if the missed days were weekend days
    const missedDays: Date[] = [];
    for (let i = 1; i < daysDifference; i++) {
      missedDays.push(subDays(today, i));
    }

    const allMissedAreWeekend = missedDays.every((day) => isWeekend(day));
    if (allMissedAreWeekend) {
      amuletUsed = true;
      streakBroken = false;
      newStreak = streakData.currentStreak + 1;
    }
  }

  // Check if freeze can be used (missed exactly 1 day, have freezes)
  if (
    streakBroken &&
    daysDifference === 2 &&
    streakData.freezesAvailable > 0
  ) {
    freezeUsed = true;
    streakBroken = false;
    newStreak = streakData.currentStreak + 1;
  }

  const milestone =
    !streakBroken && STREAK_MILESTONES.includes(newStreak)
      ? newStreak
      : null;

  return {
    newStreak,
    streakBroken,
    freezeUsed,
    amuletUsed,
    milestoneReached: milestone,
  };
}

// Calculate how many freezes a user should earn based on their streak
export function calculateFreezesEarned(
  currentStreak: number,
  currentFreezes: number
): number {
  const maxFreezes = 2;

  // Earn 1 freeze per 7-day streak (up to max)
  if (currentStreak > 0 && currentStreak % 7 === 0) {
    return Math.min(currentFreezes + 1, maxFreezes) - currentFreezes;
  }

  return 0;
}

// Format streak for display
export function formatStreak(streak: number): string {
  if (streak === 0) return "No streak";
  if (streak === 1) return "1 day";
  return `${streak} days`;
}

// Get motivational message based on streak status
export function getStreakMessage(
  streak: number,
  isAtRisk: boolean
): string {
  if (streak === 0) {
    return "Start your streak today!";
  }

  if (isAtRisk) {
    return "Log a match to keep your streak!";
  }

  if (streak < 3) {
    return "Keep it going!";
  }

  if (streak < 7) {
    return "You're on a roll!";
  }

  if (streak < 14) {
    return "On fire!";
  }

  if (streak < 30) {
    return "Unstoppable!";
  }

  return "Legendary!";
}
