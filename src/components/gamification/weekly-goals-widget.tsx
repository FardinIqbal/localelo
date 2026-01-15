"use client";

import { motion } from "framer-motion";
import { Target, Trophy, Zap, Calendar, Star, ChevronRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 4,
  color = "orange",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: "orange" | "emerald" | "blue" | "amber";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    orange: "stroke-orange-500",
    emerald: "stroke-emerald-500",
    blue: "stroke-blue-500",
    amber: "stroke-amber-500",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-zinc-800 fill-none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={`${colorClasses[color]} fill-none`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

function GoalItem({
  icon: Icon,
  label,
  current,
  target,
  progress,
  color = "orange",
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  target: number;
  progress: number;
  color?: "orange" | "emerald" | "blue" | "amber";
}) {
  const completed = current >= target;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
        completed ? "bg-emerald-500/5" : "hover:bg-zinc-800/50"
      }`}
    >
      <ProgressRing progress={progress} size={36} strokeWidth={3} color={completed ? "emerald" : color} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-zinc-300">{label}</p>
        <p className="text-[11px] text-zinc-600">
          <span className={completed ? "text-emerald-400" : "text-white"}>
            {current}
          </span>{" "}
          / {target}
        </p>
      </div>
      {completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          Done
        </motion.div>
      )}
    </motion.div>
  );
}

function MilestoneItem({
  leaderboardName,
  currentRating,
  targetRating,
  targetLabel,
  progress,
  ratingNeeded,
  color,
}: {
  leaderboardName: string;
  currentRating: number;
  targetRating: number;
  targetLabel: string;
  progress: number;
  ratingNeeded: number;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
    blue: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30" },
    amber: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30" },
  };

  const styles = colorClasses[color] || colorClasses.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[11px] text-zinc-500">{leaderboardName}</p>
          <p className={`text-[13px] font-semibold ${styles.text}`}>{targetLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-bold text-white tabular-nums">{currentRating}</p>
          <p className="text-[10px] text-zinc-600">{ratingNeeded} to go</p>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${styles.bg}`}
        />
      </div>
    </motion.div>
  );
}

export function WeeklyGoalsWidget() {
  const weeklyProgress = useQuery(api.goals.getWeeklyProgress);
  const milestones = useQuery(api.goals.getMilestoneProgress);

  if (weeklyProgress === undefined) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
        <div className="h-32 bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  if (!weeklyProgress) {
    return null;
  }

  const completedGoals = [
    weeklyProgress.matchesProgress >= 100,
    weeklyProgress.winsProgress >= 100,
    weeklyProgress.xpProgress >= 100,
    weeklyProgress.daysProgress >= 100,
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-2.5">
              <Target className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">Weekly Goals</p>
              <p className="text-[11px] text-zinc-500">
                {completedGoals} of 4 completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`h-2 w-2 rounded-full ${
                  i < completedGoals ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="p-2">
        <GoalItem
          icon={Target}
          label="Play matches"
          current={weeklyProgress.matchesThisWeek}
          target={weeklyProgress.matchesTarget}
          progress={weeklyProgress.matchesProgress}
          color="orange"
        />
        <GoalItem
          icon={Trophy}
          label="Win matches"
          current={weeklyProgress.winsThisWeek}
          target={weeklyProgress.winsTarget}
          progress={weeklyProgress.winsProgress}
          color="emerald"
        />
        <GoalItem
          icon={Zap}
          label="Earn XP"
          current={weeklyProgress.xpThisWeek}
          target={weeklyProgress.xpTarget}
          progress={weeklyProgress.xpProgress}
          color="amber"
        />
        <GoalItem
          icon={Calendar}
          label="Active days"
          current={weeklyProgress.daysActive}
          target={weeklyProgress.daysTarget}
          progress={weeklyProgress.daysProgress}
          color="blue"
        />
      </div>

      {/* Rating Milestones */}
      {milestones && milestones.length > 0 && (
        <div className="p-3 pt-0 border-t border-zinc-800/50 mt-2">
          <div className="flex items-center justify-between mb-2 pt-3">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Rating Milestones
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {milestones.slice(0, 2).map((milestone) => (
              <MilestoneItem
                key={milestone.leaderboardId}
                leaderboardName={milestone.leaderboardName}
                currentRating={milestone.currentRating}
                targetRating={milestone.targetRating}
                targetLabel={milestone.targetLabel}
                progress={milestone.progress}
                ratingNeeded={milestone.ratingNeeded}
                color={milestone.color}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
