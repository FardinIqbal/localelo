"use client";

import { motion } from "framer-motion";
import { Flame, Shield, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function StreakWidget() {
  const streak = useQuery(api.streaks.getMyStreak);
  const useFreeze = useMutation(api.streaks.useFreeze);

  if (streak === undefined) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
        <div className="h-16 bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  if (!streak || streak.currentStreak === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-2.5">
            <Flame className="h-5 w-5 text-zinc-600" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-zinc-400">No active streak</p>
            <p className="text-[11px] text-zinc-600">Log a match to start your streak</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleUseFreeze = async () => {
    try {
      await useFreeze();
    } catch (error) {
      console.error("Failed to use freeze:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${
        streak.streakAtRisk
          ? "border-orange-500/30 bg-orange-500/5"
          : streak.currentStreak >= 7
          ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Streak flame */}
          <div className={`relative rounded-lg p-2.5 ${
            streak.currentStreak >= 7
              ? "bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30"
              : streak.currentStreak >= 3
              ? "bg-orange-500/10 border border-orange-500/20"
              : "bg-zinc-800 border border-zinc-700"
          }`}>
            <motion.div
              animate={streak.currentStreak >= 3 ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flame className={`h-5 w-5 ${
                streak.currentStreak >= 7
                  ? "text-orange-400"
                  : streak.currentStreak >= 3
                  ? "text-orange-500"
                  : "text-zinc-500"
              }`} />
            </motion.div>
            {streak.currentStreak >= 7 && (
              <motion.div
                className="absolute -inset-1 rounded-xl bg-orange-500/20 blur-md -z-10"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums ${
                streak.currentStreak >= 7
                  ? "text-orange-400"
                  : streak.currentStreak >= 3
                  ? "text-orange-500"
                  : "text-white"
              }`}>
                {streak.currentStreak}
              </span>
              <span className="text-[13px] font-medium text-zinc-400">
                day streak
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {streak.isActiveToday ? (
                <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active today
                </span>
              ) : streak.streakAtRisk ? (
                <span className="text-[11px] text-orange-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Log a match to keep your streak!
                </span>
              ) : (
                <span className="text-[11px] text-zinc-600">
                  Best: {streak.longestStreak} days
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Freeze indicator */}
        {streak.freezesAvailable > 0 && !streak.isActiveToday && (
          <button
            onClick={handleUseFreeze}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            {streak.freezesAvailable} freeze
          </button>
        )}
      </div>
    </motion.div>
  );
}
