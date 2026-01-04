"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TierBadge } from "./tier-badge";
import { LEAGUE_CONFIG, type LeagueTier, formatXp } from "@/lib/xp-calculator";
import { differenceInDays, differenceInHours, format } from "date-fns";

interface LeagueCardProps {
  tier: LeagueTier;
  userRank: number;
  participantCount: number;
  weeklyXp: number;
  promoteCount: number;
  demoteCount: number;
  zone: "promote" | "safe" | "demote" | "none";
  weekEnd: Date;
  onClick?: () => void;
}

export function LeagueCard({
  tier,
  userRank,
  participantCount,
  weeklyXp,
  promoteCount,
  demoteCount,
  zone,
  weekEnd,
  onClick,
}: LeagueCardProps) {
  const config = LEAGUE_CONFIG[tier];

  // Calculate time remaining
  const now = new Date();
  const hoursLeft = differenceInHours(weekEnd, now);
  const daysLeft = differenceInDays(weekEnd, now);

  const timeText =
    daysLeft > 0
      ? `${daysLeft}d ${hoursLeft % 24}h left`
      : `${hoursLeft}h left`;

  // Zone colors and icons
  const zoneConfig = {
    promote: {
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
      icon: TrendingUp,
      label: "Promotion Zone",
    },
    safe: {
      color: "text-muted-foreground",
      bgColor: "border-border",
      icon: Minus,
      label: "Safe Zone",
    },
    demote: {
      color: "text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/30",
      icon: TrendingDown,
      label: "Demotion Zone",
    },
    none: {
      color: "text-muted-foreground",
      bgColor: "border-border",
      icon: Minus,
      label: "",
    },
  };

  const zoneInfo = zoneConfig[zone];
  const ZoneIcon = zoneInfo.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-colors",
        zoneInfo.bgColor,
        "hover:bg-secondary/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} size="md" />
          <div>
            <p className={cn("font-semibold", config.color)}>
              {config.name} League
            </p>
            <p className="text-xs text-muted-foreground">
              {participantCount} participants
            </p>
          </div>
        </div>

        {/* Time remaining */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeText}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {/* Rank */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-2xl font-bold">{userRank}</span>
          </div>
          <p className="text-xs text-muted-foreground">Rank</p>
        </div>

        {/* XP */}
        <div className="text-center">
          <p className="text-2xl font-bold">{formatXp(weeklyXp)}</p>
          <p className="text-xs text-muted-foreground">Weekly XP</p>
        </div>

        {/* Zone indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <ZoneIcon className={cn("h-4 w-4", zoneInfo.color)} />
            <span className={cn("font-medium", zoneInfo.color)}>
              {zone === "promote"
                ? `Top ${promoteCount}`
                : zone === "demote"
                ? `Bot ${demoteCount}`
                : "-"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {zoneInfo.label || "Position"}
          </p>
        </div>
      </div>

      {/* Progress bar (optional visual for rank position) */}
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          {/* Promotion zone (green) */}
          <div
            className="inline-block h-full bg-emerald-500"
            style={{
              width: `${(promoteCount / participantCount) * 100}%`,
            }}
          />
          {/* Safe zone (gray) */}
          <div
            className="inline-block h-full bg-muted-foreground/30"
            style={{
              width: `${((participantCount - promoteCount - demoteCount) / participantCount) * 100}%`,
            }}
          />
          {/* Demotion zone (red) */}
          {demoteCount > 0 && (
            <div
              className="inline-block h-full bg-rose-500"
              style={{
                width: `${(demoteCount / participantCount) * 100}%`,
              }}
            />
          )}
        </div>
        {/* User position marker */}
        <div className="relative -mt-2">
          <div
            className="absolute top-0 h-4 w-0.5 bg-foreground"
            style={{
              left: `${((userRank - 0.5) / participantCount) * 100}%`,
            }}
          />
        </div>
      </div>
    </motion.button>
  );
}
