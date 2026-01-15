"use client";

import { motion } from "framer-motion";
import { Trophy, ChevronUp, ChevronDown, Clock, Zap } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const TIER_CONFIG: Record<
  string,
  { icon: string; gradient: string; glow: string; border: string }
> = {
  bronze: {
    icon: "Cu",
    gradient: "from-amber-800 to-amber-950",
    glow: "shadow-amber-900/50",
    border: "border-amber-700/40",
  },
  silver: {
    icon: "Ag",
    gradient: "from-zinc-400 to-zinc-600",
    glow: "shadow-zinc-400/30",
    border: "border-zinc-500/40",
  },
  gold: {
    icon: "Au",
    gradient: "from-yellow-400 to-amber-500",
    glow: "shadow-yellow-500/40",
    border: "border-yellow-500/40",
  },
  platinum: {
    icon: "Pt",
    gradient: "from-cyan-300 to-cyan-500",
    glow: "shadow-cyan-400/40",
    border: "border-cyan-400/40",
  },
  diamond: {
    icon: "C",
    gradient: "from-blue-300 to-blue-500",
    glow: "shadow-blue-400/50",
    border: "border-blue-400/40",
  },
  champion: {
    icon: "Ch",
    gradient: "from-purple-400 to-pink-500",
    glow: "shadow-purple-500/50",
    border: "border-purple-400/40",
  },
};

export function WeeklyLeagueWidget() {
  const leagueStatus = useQuery(api.leagues.getMyLeagueStatus);
  const weeklyLeaderboard = useQuery(api.leagues.getWeeklyLeaderboard, {
    limit: 5,
  });

  if (leagueStatus === undefined || weeklyLeaderboard === undefined) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
        <div className="h-32 bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  if (!leagueStatus) {
    return null;
  }

  const tier = leagueStatus.tier;
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.bronze;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${tierConfig.border} bg-zinc-900/50 overflow-hidden`}
    >
      {/* Header with tier badge */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Tier badge */}
            <div className={`relative rounded-lg p-2.5 bg-gradient-to-br ${tierConfig.gradient}`}>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Trophy className="h-5 w-5 text-white" />
              </motion.div>
              <div
                className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${tierConfig.gradient} opacity-30 blur-md -z-10`}
              />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-semibold text-white capitalize">
                  {tier} League
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-zinc-500">Weekly XP:</span>
                <span className="text-[13px] font-medium text-orange-400 tabular-nums flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {leagueStatus.weeklyXp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Time remaining */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Clock className="h-3 w-3" />
              Resets in
            </div>
            <div className="text-[13px] font-medium text-zinc-300 tabular-nums">
              {leagueStatus.timeRemaining.days}d {leagueStatus.timeRemaining.hours}h
            </div>
          </div>
        </div>

        {/* Rank indicator */}
        {leagueStatus.rank && (
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span className="text-zinc-500">Your rank</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                #{leagueStatus.rank}
              </span>
              <span className="text-zinc-600">
                of {leagueStatus.totalInTier}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mini leaderboard */}
      {weeklyLeaderboard?.rankings && weeklyLeaderboard.rankings.length > 0 && (
        <div className="p-3">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Top players this week
          </div>
          <div className="space-y-1.5">
            {weeklyLeaderboard.rankings.slice(0, 5).map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                  player.isCurrentUser
                    ? "bg-orange-500/10 border border-orange-500/20"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 text-[12px] font-medium tabular-nums ${
                      player.rank === 1
                        ? "text-yellow-400"
                        : player.rank === 2
                        ? "text-zinc-400"
                        : player.rank === 3
                        ? "text-amber-600"
                        : "text-zinc-600"
                    }`}
                  >
                    #{player.rank}
                  </span>
                  {player.imageUrl ? (
                    <img
                      src={player.imageUrl}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-[10px] text-zinc-500">
                        {player.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span
                    className={`text-[12px] ${
                      player.isCurrentUser ? "text-orange-400 font-medium" : "text-zinc-300"
                    }`}
                  >
                    {player.isCurrentUser ? "You" : player.name}
                  </span>
                </div>
                <span className="text-[12px] text-zinc-500 tabular-nums">
                  {player.weeklyXp.toLocaleString()} XP
                </span>
              </motion.div>
            ))}
          </div>

          {/* Show user rank if not in top 5 */}
          {weeklyLeaderboard.userRank && weeklyLeaderboard.userRank > 5 && (
            <div className="mt-2 pt-2 border-t border-zinc-800/50">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-[12px] text-zinc-600 font-medium tabular-nums">
                    #{weeklyLeaderboard.userRank}
                  </span>
                  <span className="text-[12px] text-orange-400 font-medium">You</span>
                </div>
                <span className="text-[12px] text-zinc-500 tabular-nums">
                  {leagueStatus.weeklyXp.toLocaleString()} XP
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress to next tier */}
      {leagueStatus.xpToNextTier > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-zinc-500">Progress to next tier</span>
            <span className="text-zinc-400">{leagueStatus.xpToNextTier.toLocaleString()} XP to go</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (leagueStatus.totalXp / (leagueStatus.totalXp + leagueStatus.xpToNextTier)) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${tierConfig.gradient}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
