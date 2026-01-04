// XP calculation system
// Based on Duolingo's model with competitive gaming elements

export type LeagueTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "champion";

export interface XpResult {
  baseXp: number;
  upsetBonus: number;
  streakBonus: number;
  totalXp: number;
  breakdown: string[];
}

// XP values
const XP_VALUES = {
  WIN_BASE: 15,
  DRAW_BASE: 10,
  LOSS_BASE: 5, // Participation XP
  UPSET_SMALL: 5, // Beat someone 50-100 rating higher
  UPSET_MEDIUM: 8, // Beat someone 100-200 rating higher
  UPSET_LARGE: 12, // Beat someone 200+ rating higher
  UNDERDOG_BONUS: 3, // Lost to someone significantly higher rated
  STREAK_BONUS_PER_DAY: 2, // Bonus per day of streak (max 5 days = 10 XP)
  STREAK_BONUS_MAX: 10,
};

// League tier configuration
export const LEAGUE_CONFIG: Record<
  LeagueTier,
  {
    name: string;
    color: string;
    bgColor: string;
    minXp: number;
    promoteTop: number;
    demoteBottom: number;
    maxParticipants: number;
  }
> = {
  bronze: {
    name: "Bronze",
    color: "text-amber-700",
    bgColor: "bg-amber-700/10",
    minXp: 0,
    promoteTop: 20, // Top 20% promote
    demoteBottom: 0, // No demotion in bronze
    maxParticipants: 30,
  },
  silver: {
    name: "Silver",
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
    minXp: 100,
    promoteTop: 15, // Top 15% promote
    demoteBottom: 10, // Bottom 10% demote
    maxParticipants: 30,
  },
  gold: {
    name: "Gold",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    minXp: 300,
    promoteTop: 12,
    demoteBottom: 10,
    maxParticipants: 30,
  },
  platinum: {
    name: "Platinum",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    minXp: 600,
    promoteTop: 10,
    demoteBottom: 10,
    maxParticipants: 30,
  },
  diamond: {
    name: "Diamond",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    minXp: 1000,
    promoteTop: 5, // Only top 5 go to Champion
    demoteBottom: 10,
    maxParticipants: 30,
  },
  champion: {
    name: "Champion",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    minXp: 2000,
    promoteTop: 0, // Can't promote from Champion
    demoteBottom: 50, // Bottom 50% demote (harsh!)
    maxParticipants: 20,
  },
};

// Calculate XP for a match result
export function calculateMatchXp(
  outcome: "win" | "loss" | "draw",
  playerRating: number,
  opponentRating: number,
  currentStreak: number
): XpResult {
  const breakdown: string[] = [];
  let baseXp = 0;
  let upsetBonus = 0;
  let streakBonus = 0;

  // Base XP
  switch (outcome) {
    case "win":
      baseXp = XP_VALUES.WIN_BASE;
      breakdown.push(`Win: +${XP_VALUES.WIN_BASE} XP`);
      break;
    case "draw":
      baseXp = XP_VALUES.DRAW_BASE;
      breakdown.push(`Draw: +${XP_VALUES.DRAW_BASE} XP`);
      break;
    case "loss":
      baseXp = XP_VALUES.LOSS_BASE;
      breakdown.push(`Participation: +${XP_VALUES.LOSS_BASE} XP`);
      break;
  }

  // Upset bonus (only for wins)
  if (outcome === "win") {
    const ratingDiff = opponentRating - playerRating;
    if (ratingDiff >= 200) {
      upsetBonus = XP_VALUES.UPSET_LARGE;
      breakdown.push(`Major Upset: +${XP_VALUES.UPSET_LARGE} XP`);
    } else if (ratingDiff >= 100) {
      upsetBonus = XP_VALUES.UPSET_MEDIUM;
      breakdown.push(`Upset Win: +${XP_VALUES.UPSET_MEDIUM} XP`);
    } else if (ratingDiff >= 50) {
      upsetBonus = XP_VALUES.UPSET_SMALL;
      breakdown.push(`Minor Upset: +${XP_VALUES.UPSET_SMALL} XP`);
    }
  }

  // Underdog bonus (for losses against much higher rated)
  if (outcome === "loss") {
    const ratingDiff = opponentRating - playerRating;
    if (ratingDiff >= 150) {
      upsetBonus = XP_VALUES.UNDERDOG_BONUS;
      breakdown.push(`Underdog Effort: +${XP_VALUES.UNDERDOG_BONUS} XP`);
    }
  }

  // Streak bonus (for any match, based on activity streak)
  if (currentStreak > 0) {
    const streakDays = Math.min(currentStreak, 5);
    streakBonus = streakDays * XP_VALUES.STREAK_BONUS_PER_DAY;
    streakBonus = Math.min(streakBonus, XP_VALUES.STREAK_BONUS_MAX);
    if (streakBonus > 0) {
      breakdown.push(`Streak Bonus (${currentStreak} days): +${streakBonus} XP`);
    }
  }

  return {
    baseXp,
    upsetBonus,
    streakBonus,
    totalXp: baseXp + upsetBonus + streakBonus,
    breakdown,
  };
}

// Get the tier above the current one
export function getNextTier(tier: LeagueTier): LeagueTier | null {
  const tiers: LeagueTier[] = [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "champion",
  ];
  const currentIndex = tiers.indexOf(tier);
  if (currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1];
  }
  return null;
}

// Get the tier below the current one
export function getPreviousTier(tier: LeagueTier): LeagueTier | null {
  const tiers: LeagueTier[] = [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "champion",
  ];
  const currentIndex = tiers.indexOf(tier);
  if (currentIndex > 0) {
    return tiers[currentIndex - 1];
  }
  return null;
}

// Calculate promotion/demotion thresholds
export function calculateLeagueThresholds(
  tier: LeagueTier,
  participantCount: number
): {
  promoteCount: number;
  demoteCount: number;
} {
  const config = LEAGUE_CONFIG[tier];

  const promoteCount = Math.floor(
    (participantCount * config.promoteTop) / 100
  );
  const demoteCount = Math.floor(
    (participantCount * config.demoteBottom) / 100
  );

  return { promoteCount, demoteCount };
}

// Get tier from total XP
export function getTierFromXp(totalXp: number): LeagueTier {
  if (totalXp >= LEAGUE_CONFIG.champion.minXp) return "champion";
  if (totalXp >= LEAGUE_CONFIG.diamond.minXp) return "diamond";
  if (totalXp >= LEAGUE_CONFIG.platinum.minXp) return "platinum";
  if (totalXp >= LEAGUE_CONFIG.gold.minXp) return "gold";
  if (totalXp >= LEAGUE_CONFIG.silver.minXp) return "silver";
  return "bronze";
}

// Format XP with animation-friendly values
export function formatXp(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

// Get week dates for league (Sunday to Saturday)
export function getLeagueWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Get start of current week (Sunday)
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  // Get end of current week (Saturday 23:59:59)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
