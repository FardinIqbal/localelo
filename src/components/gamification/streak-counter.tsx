"use client";

import { motion } from "framer-motion";
import { Flame, Shield, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStreakColor,
  getStreakTier,
  getStreakMessage,
  formatStreak,
} from "@/lib/streak-utils";

interface StreakCounterProps {
  streak: number;
  longestStreak: number;
  atRisk?: boolean;
  freezesAvailable?: number;
  weekendAmuletActive?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function StreakCounter({
  streak,
  longestStreak,
  atRisk = false,
  freezesAvailable = 0,
  weekendAmuletActive = false,
  compact = false,
  onClick,
}: StreakCounterProps) {
  const color = getStreakColor(streak);
  const tier = getStreakTier(streak);
  const message = getStreakMessage(streak, atRisk);

  const colorClasses: Record<string, string> = {
    gray: "text-gray-400 bg-gray-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    red: "text-red-400 bg-red-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    gold: "text-amber-400 bg-amber-500/10",
  };

  const flameColors: Record<string, string> = {
    gray: "text-gray-400",
    orange: "text-orange-400",
    red: "text-red-500",
    purple: "text-purple-500",
    gold: "text-amber-400",
  };

  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
          colorClasses[color],
          atRisk && "animate-pulse"
        )}
      >
        <Flame className={cn("h-4 w-4", flameColors[color])} />
        <span className="text-sm font-bold">{streak}</span>
        {atRisk && (
          <span className="text-[10px] font-medium text-rose-400">!</span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border p-4",
        colorClasses[color]
      )}
    >
      {/* Background effect */}
      <div className="absolute inset-0 opacity-20">
        <div
          className={cn(
            "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
            color === "gold"
              ? "bg-amber-500"
              : color === "purple"
              ? "bg-purple-500"
              : color === "red"
              ? "bg-red-500"
              : color === "orange"
              ? "bg-orange-500"
              : "bg-gray-500"
          )}
        />
      </div>

      <div className="relative flex items-center justify-between">
        {/* Flame and count */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: atRisk ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: atRisk ? Infinity : 0,
            }}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              colorClasses[color]
            )}
          >
            <Flame className={cn("h-7 w-7", flameColors[color])} />
          </motion.div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{streak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        </div>

        {/* Protection indicators */}
        <div className="flex flex-col items-end gap-1">
          {/* Freezes */}
          <div className="flex items-center gap-1">
            {[...Array(2)].map((_, i) => (
              <Snowflake
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < freezesAvailable
                    ? "text-cyan-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Weekend Amulet */}
          {weekendAmuletActive && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>Weekend protected</span>
            </div>
          )}
        </div>
      </div>

      {/* Tier and best */}
      <div className="relative mt-3 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <span>
          Tier: <span className={flameColors[color]}>{tier}</span>
        </span>
        <span>
          Best: <span className="font-medium">{longestStreak} days</span>
        </span>
      </div>

      {/* At risk warning */}
      {atRisk && streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-400"
        >
          <Flame className="h-4 w-4" />
          <span>Log a match today to keep your streak!</span>
        </motion.div>
      )}
    </motion.div>
  );
}
