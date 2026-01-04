"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  Star,
  Zap,
  Award,
  Crown,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AchievementType =
  | "first_win"
  | "first_match"
  | "win_streak_3"
  | "win_streak_5"
  | "win_streak_10"
  | "upset_win"
  | "rating_1600"
  | "rating_1800"
  | "rating_2000"
  | "matches_10"
  | "matches_50"
  | "matches_100"
  | "activity_streak_7"
  | "activity_streak_30"
  | "activity_streak_100"
  | "tier_silver"
  | "tier_gold"
  | "tier_platinum"
  | "tier_diamond"
  | "tier_champion"
  | "league_winner";

interface AchievementConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENTS: Record<AchievementType, AchievementConfig> = {
  first_win: {
    title: "First Victory",
    description: "Won your first match",
    icon: Trophy,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    rarity: "common",
  },
  first_match: {
    title: "Welcome",
    description: "Logged your first match",
    icon: Star,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    rarity: "common",
  },
  win_streak_3: {
    title: "Hat Trick",
    description: "Won 3 matches in a row",
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    rarity: "common",
  },
  win_streak_5: {
    title: "Dominating",
    description: "Won 5 matches in a row",
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    rarity: "rare",
  },
  win_streak_10: {
    title: "Unstoppable",
    description: "Won 10 matches in a row",
    icon: Flame,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    rarity: "epic",
  },
  upset_win: {
    title: "Giant Slayer",
    description: "Beat a higher-rated opponent",
    icon: Swords,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    rarity: "rare",
  },
  rating_1600: {
    title: "Rising Star",
    description: "Reached 1600 rating",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    rarity: "common",
  },
  rating_1800: {
    title: "Expert",
    description: "Reached 1800 rating",
    icon: Target,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    rarity: "rare",
  },
  rating_2000: {
    title: "Master",
    description: "Reached 2000 rating",
    icon: Crown,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    rarity: "epic",
  },
  matches_10: {
    title: "Getting Started",
    description: "Played 10 matches",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    rarity: "common",
  },
  matches_50: {
    title: "Regular",
    description: "Played 50 matches",
    icon: Zap,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    rarity: "rare",
  },
  matches_100: {
    title: "Veteran",
    description: "Played 100 matches",
    icon: Award,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    rarity: "epic",
  },
  activity_streak_7: {
    title: "Dedicated",
    description: "7 day activity streak",
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    rarity: "common",
  },
  activity_streak_30: {
    title: "Committed",
    description: "30 day activity streak",
    icon: Flame,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    rarity: "rare",
  },
  activity_streak_100: {
    title: "Legendary Streak",
    description: "100 day activity streak",
    icon: Flame,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    rarity: "legendary",
  },
  tier_silver: {
    title: "Silver League",
    description: "Promoted to Silver tier",
    icon: Award,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    rarity: "common",
  },
  tier_gold: {
    title: "Gold League",
    description: "Promoted to Gold tier",
    icon: Award,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    rarity: "rare",
  },
  tier_platinum: {
    title: "Platinum League",
    description: "Promoted to Platinum tier",
    icon: Award,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    rarity: "epic",
  },
  tier_diamond: {
    title: "Diamond League",
    description: "Promoted to Diamond tier",
    icon: Award,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    rarity: "epic",
  },
  tier_champion: {
    title: "Champion",
    description: "Reached Champion tier",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    rarity: "legendary",
  },
  league_winner: {
    title: "League Winner",
    description: "Won your weekly league",
    icon: Trophy,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    rarity: "epic",
  },
};

const RARITY_COLORS = {
  common: "border-gray-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/30",
};

const RARITY_GLOW = {
  common: "",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/20",
  legendary: "shadow-amber-500/20 shadow-lg",
};

interface AchievementToastProps {
  type: AchievementType;
  isVisible: boolean;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  duration?: number;
}

export function AchievementToast({
  type,
  isVisible,
  onDismiss,
  autoDismiss = true,
  duration = 4000,
}: AchievementToastProps) {
  const config = ACHIEVEMENTS[type];

  useEffect(() => {
    if (isVisible && autoDismiss) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismiss, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed left-1/2 top-20 z-[100] -translate-x-1/2"
          onClick={onDismiss}
        >
          <div
            className={cn(
              "flex items-center gap-4 rounded-2xl border bg-background/95 px-5 py-4 backdrop-blur-md",
              RARITY_COLORS[config.rarity],
              RARITY_GLOW[config.rarity]
            )}
          >
            {/* Icon */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                config.bgColor
              )}
            >
              <config.icon className={cn("h-6 w-6", config.color)} />
            </motion.div>

            {/* Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Achievement Unlocked
                </p>
                <p className={cn("text-lg font-bold", config.color)}>
                  {config.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple toast notification hook/context could be added here
// For now, this is a controlled component
