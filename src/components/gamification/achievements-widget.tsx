"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Swords,
  Target,
  Medal,
  Award,
  Flame,
  Crown,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Repeat,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
  Trophy,
  Swords,
  Target,
  Medal,
  Award,
  Flame,
  Crown,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Repeat,
  Zap,
};

const RARITY_STYLES = {
  common: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    text: "text-zinc-400",
    glow: "",
    label: "Common",
  },
  uncommon: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/10",
    label: "Uncommon",
  },
  rare: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    label: "Rare",
  },
  legendary: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/30",
    label: "Legendary",
  },
};

function AchievementBadge({
  name,
  description,
  icon,
  rarity,
  achievedAt,
  unlocked = true,
  size = "normal",
}: {
  name: string;
  description: string;
  icon: string;
  rarity: string;
  achievedAt?: number;
  unlocked?: boolean;
  size?: "small" | "normal";
}) {
  const Icon = ICON_MAP[icon] || Trophy;
  const styles = RARITY_STYLES[rarity as keyof typeof RARITY_STYLES] || RARITY_STYLES.common;

  const isSmall = size === "small";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-xl border ${styles.border} ${styles.bg} ${
        unlocked ? "" : "opacity-40"
      } ${isSmall ? "p-2.5" : "p-3"} transition-all cursor-default ${
        styles.glow ? `shadow-lg ${styles.glow}` : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg ${styles.bg} border ${styles.border} ${
            isSmall ? "p-1.5" : "p-2"
          }`}
        >
          <Icon className={`${isSmall ? "h-4 w-4" : "h-5 w-5"} ${styles.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`font-semibold text-white truncate ${
                isSmall ? "text-[12px]" : "text-[13px]"
              }`}
            >
              {name}
            </p>
            {rarity === "legendary" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium uppercase tracking-wider">
                Legendary
              </span>
            )}
          </div>
          <p className={`text-zinc-500 truncate ${isSmall ? "text-[10px]" : "text-[11px]"}`}>
            {description}
          </p>
        </div>
        {unlocked && !isSmall && (
          <div className={`h-2 w-2 rounded-full ${styles.text.replace("text-", "bg-")}`} />
        )}
      </div>
    </motion.div>
  );
}

export function AchievementsWidget() {
  const achievementData = useQuery(api.achievements.getMyAchievements);
  const stats = useQuery(api.achievements.getAchievementStats);

  if (achievementData === undefined || stats === undefined) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
        <div className="h-24 bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  if (!achievementData || achievementData.achievements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-2.5">
            <Award className="h-5 w-5 text-zinc-600" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-zinc-400">No achievements yet</p>
            <p className="text-[11px] text-zinc-600">Log your first match to start earning</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const { achievements, recentUnlocks } = achievementData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
    >
      {/* Header with progress */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5">
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">Achievements</p>
              <p className="text-[11px] text-zinc-500">
                {stats?.unlocked || 0} of {stats?.total || 0} unlocked ({stats?.percentage || 0}%)
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/achievements"
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats?.percentage || 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>

        {/* Rarity breakdown */}
        <div className="mt-3 flex items-center gap-3">
          {Object.entries(stats?.byRarity || {}).map(([rarity, count]) => (
            <div key={rarity} className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  RARITY_STYLES[rarity as keyof typeof RARITY_STYLES]?.text.replace("text-", "bg-") ||
                  "bg-zinc-600"
                }`}
              />
              <span className="text-[10px] text-zinc-500 capitalize">
                {count} {rarity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent unlocks */}
      {recentUnlocks.length > 0 && (
        <div className="p-3 border-b border-zinc-800/50">
          <div className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Recently Unlocked
          </div>
          <div className="space-y-2">
            {recentUnlocks.slice(0, 2).map((achievement, i) => (
              <AchievementBadge
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                icon={achievement.icon}
                rarity={achievement.rarity}
                achievedAt={achievement.achievedAt}
                size="small"
              />
            ))}
          </div>
        </div>
      )}

      {/* Top achievements */}
      <div className="p-3">
        <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
          Top Achievements
        </div>
        <div className="space-y-2">
          {achievements.slice(0, 3).map((achievement, i) => (
            <AchievementBadge
              key={achievement.id}
              name={achievement.name}
              description={achievement.description}
              icon={achievement.icon}
              rarity={achievement.rarity}
              achievedAt={achievement.achievedAt}
              size="small"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Toast notification for new achievement
 */
export function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: string;
  };
  onDismiss: () => void;
}) {
  const Icon = ICON_MAP[achievement.icon] || Trophy;
  const styles =
    RARITY_STYLES[achievement.rarity as keyof typeof RARITY_STYLES] || RARITY_STYLES.common;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      onClick={onDismiss}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 cursor-pointer`}
    >
      <motion.div
        animate={{
          boxShadow: [
            `0 0 20px ${styles.text.includes("amber") ? "rgba(245,158,11,0.3)" : styles.text.includes("blue") ? "rgba(59,130,246,0.3)" : styles.text.includes("emerald") ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
            `0 0 40px ${styles.text.includes("amber") ? "rgba(245,158,11,0.5)" : styles.text.includes("blue") ? "rgba(59,130,246,0.5)" : styles.text.includes("emerald") ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.2)"}`,
            `0 0 20px ${styles.text.includes("amber") ? "rgba(245,158,11,0.3)" : styles.text.includes("blue") ? "rgba(59,130,246,0.3)" : styles.text.includes("emerald") ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`rounded-xl border ${styles.border} ${styles.bg} backdrop-blur-md px-5 py-4`}
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`rounded-xl ${styles.bg} border ${styles.border} p-3`}
          >
            <Icon className={`h-6 w-6 ${styles.text}`} />
          </motion.div>
          <div>
            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider mb-0.5">
              Achievement Unlocked!
            </p>
            <p className="text-[15px] font-bold text-white">{achievement.name}</p>
            <p className="text-[12px] text-zinc-500">{achievement.description}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
