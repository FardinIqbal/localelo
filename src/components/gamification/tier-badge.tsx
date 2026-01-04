"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LEAGUE_CONFIG, type LeagueTier } from "@/lib/xp-calculator";

interface TierBadgeProps {
  tier: LeagueTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
}

const tierIcons: Record<LeagueTier, string> = {
  bronze: "B",
  silver: "S",
  gold: "G",
  platinum: "P",
  diamond: "D",
  champion: "C",
};

export function TierBadge({
  tier,
  size = "md",
  showLabel = false,
  animate = false,
}: TierBadgeProps) {
  const config = LEAGUE_CONFIG[tier];

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  const badge = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg font-bold",
        sizeClasses[size],
        config.bgColor,
        config.color
      )}
    >
      {/* Gradient overlay for shine effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />

      {/* Icon letter */}
      <span className="relative z-10">{tierIcons[tier]}</span>

      {/* Champion special effect */}
      {tier === "champion" && (
        <div className="absolute -inset-1 animate-pulse rounded-lg bg-purple-500/20" />
      )}
    </div>
  );

  if (animate) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {badge}
        </motion.div>
        {showLabel && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn("font-medium", config.color)}
          >
            {config.name}
          </motion.span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {badge}
      {showLabel && (
        <span className={cn("font-medium", config.color)}>{config.name}</span>
      )}
    </div>
  );
}
