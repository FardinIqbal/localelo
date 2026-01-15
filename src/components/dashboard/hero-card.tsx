"use client";

import { motion } from "framer-motion";
import { Flame, TrendingUp, TrendingDown, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  rating: number;
  rank: number;
  recentChange: number;
  streak: number;
  totalWins: number;
  totalMatches: number;
  leaderboardName: string;
  orgName: string;
}

export function HeroCard({
  rating,
  rank,
  recentChange,
  streak,
  totalWins,
  totalMatches,
  leaderboardName,
  orgName,
}: HeroCardProps) {
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const isPositiveChange = recentChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 p-6"
    >
      {/* Intense glow effects for athletic feel */}
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-orange-600/10 blur-3xl" />
      <div className="absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-orange-400/5 blur-2xl" />

      {/* Top row - Org and leaderboard */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Trophy className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">{orgName}</p>
            <p className="text-sm font-semibold text-zinc-200">{leaderboardName}</p>
          </div>
        </div>
        {streak >= 3 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 px-3 py-1.5 shadow-lg shadow-orange-500/10"
          >
            <Flame className="h-4 w-4 text-orange-400 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" />
            <span className="text-sm font-bold text-orange-400">{streak}</span>
          </motion.div>
        )}
      </div>

      {/* Main rating display */}
      <div className="relative mb-6">
        <div className="flex items-baseline gap-3">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="font-mono text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            {Math.round(rating)}
          </motion.span>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 border",
              isPositiveChange
                ? "bg-emerald-500/15 border-emerald-500/30"
                : "bg-rose-500/15 border-rose-500/30"
            )}
          >
            {isPositiveChange ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isPositiveChange ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {isPositiveChange ? "+" : ""}
              {recentChange}
            </span>
          </motion.div>
        </div>
        <p className="mt-1 text-sm font-medium text-zinc-500 uppercase tracking-wider">Rating</p>
      </div>

      {/* Stats row */}
      <div className="relative grid grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
        <div className="text-center">
          <p className="text-2xl font-black tabular-nums text-white">
            #{rank}
          </p>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Rank</p>
        </div>
        <div className="text-center border-x border-zinc-800">
          <p className={cn(
            "text-2xl font-black tabular-nums",
            winRate >= 60 ? "text-emerald-400" : winRate <= 40 ? "text-rose-400" : "text-white"
          )}>
            {winRate}%
          </p>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Win Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black tabular-nums text-white">{totalMatches}</p>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Matches</p>
        </div>
      </div>
    </motion.div>
  );
}

// Minimal version when no ranking data
export function HeroCardEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 p-6"
    >
      {/* Subtle glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
          <Zap className="h-8 w-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Ready to compete?</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Log your first match to see your stats
        </p>
      </div>
    </motion.div>
  );
}
