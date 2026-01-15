"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Trophy,
  Swords,
  ChevronRight,
  Target,
  Zap,
  Users,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { InviteButton } from "@/components/invite/invite-modal";
import { HeroCard, HeroCardEmpty } from "@/components/dashboard/hero-card";
import { StreakWidget } from "@/components/gamification/streak-widget";
import { WeeklyLeagueWidget } from "@/components/gamification/weekly-league-widget";
import { AchievementsWidget } from "@/components/gamification/achievements-widget";
import { WeeklyGoalsWidget } from "@/components/gamification/weekly-goals-widget";

const colors = {
  gold: "text-amber-400",
  goldBg: "bg-amber-400/10",
  emerald: "text-emerald-400",
  emeraldBg: "bg-emerald-400/10",
  loss: "text-rose-400",
  lossBg: "bg-rose-400/10",
  muted: "text-muted-foreground",
};

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "gold" | "emerald" | "default";
}) {
  const colorClasses = {
    gold: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    default: "text-zinc-400 bg-zinc-800 border-zinc-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className={`rounded-lg p-2 border ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider leading-tight">{label}</p>
          <p className="text-lg font-bold tracking-tight text-white tabular-nums">{value}</p>
          {subtext && <p className="text-[10px] text-zinc-600">{subtext}</p>}
        </div>
      </div>
    </motion.div>
  );
}

function ActivityItem({
  type,
  title,
  subtitle,
  time,
  index,
}: {
  type: "win" | "loss" | "draw";
  title: string;
  subtitle: string;
  time: string;
  index: number;
}) {
  const icons = {
    win: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", glow: "shadow-emerald-500/20" },
    loss: { icon: TrendingDown, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", glow: "shadow-rose-500/20" },
    draw: { icon: Swords, color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", glow: "" },
  };

  const { icon: Icon, color, bg, glow } = icons[type];

  // Parse rating change from subtitle
  const ratingMatch = subtitle.match(/([+-]\d+)/);
  const ratingChange = ratingMatch ? parseInt(ratingMatch[1]) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
      className="flex items-start gap-4 px-4 py-4 transition-colors hover:bg-zinc-800/50"
    >
      <motion.div
        className={`mt-0.5 rounded-lg p-2 border ${bg} ${glow ? `shadow-lg ${glow}` : ""}`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1, type: "spring", stiffness: 400, damping: 15 }}
      >
        <motion.div
          initial={{ rotate: type === "win" ? -20 : type === "loss" ? 20 : 0 }}
          animate={{ rotate: 0 }}
          transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 300 }}
        >
          <Icon className={`h-4 w-4 ${color}`} />
        </motion.div>
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <motion.p
          className="text-[13px] text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {ratingChange !== 0 && (
            <span className={`font-bold tabular-nums ${ratingChange > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {ratingChange > 0 ? "+" : ""}{ratingChange}
            </span>
          )}
          {ratingChange !== 0 && " rating in "}
          {subtitle.replace(/[+-]\d+ rating in /, "")}
        </motion.p>
      </div>
      <span className="text-[12px] text-zinc-600 whitespace-nowrap">{time}</span>
    </motion.div>
  );
}

function DuckingAlert({
  name,
  days,
  org,
  orgSlug,
  leaderboardName,
}: {
  name: string;
  days: number | null;
  org: string;
  orgSlug: string;
  leaderboardName: string;
}) {
  return (
    <Link href={`/org/${orgSlug}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 transition-all hover:bg-rose-500/10 hover:border-rose-500/40 shadow-lg shadow-rose-500/5"
      >
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2">
          <Target className="h-4 w-4 text-rose-400" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-rose-400">
            Ducking {name}?
          </p>
          <p className="text-[12px] text-zinc-500">
            {days === null
              ? `Never faced in ${leaderboardName}`
              : `${days} days since your last match in ${org}`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-rose-400/50" />
      </motion.div>
    </Link>
  );
}

function RivalryCard({
  opponentName,
  orgName,
  orgSlug,
  leaderboardName,
  totalMatches,
  userWins,
  opponentWins,
  draws,
  userRating,
  opponentRating,
  index,
}: {
  opponentName: string;
  orgName: string;
  orgSlug: string;
  leaderboardName: string;
  totalMatches: number;
  userWins: number;
  opponentWins: number;
  draws: number;
  userRating: number;
  opponentRating: number;
  index: number;
}) {
  const isWinning = userWins > opponentWins;
  const isLosing = userWins < opponentWins;
  const isTied = userWins === opponentWins;

  return (
    <Link href={`/org/${orgSlug}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-[12px] font-bold text-zinc-400">
          {opponentName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-white truncate">{opponentName}</p>
            <span className={`text-[11px] font-bold tabular-nums ${
              isWinning ? "text-emerald-400" : isLosing ? "text-rose-400" : "text-zinc-500"
            }`}>
              {userWins}-{opponentWins}{draws > 0 ? `-${draws}` : ""}
            </span>
          </div>
          <p className="text-[12px] text-zinc-600">
            {leaderboardName} · {totalMatches} matches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 border ${
            isWinning ? "bg-emerald-500/10 border-emerald-500/20" : isLosing ? "bg-rose-500/10 border-rose-500/20" : "bg-zinc-800 border-zinc-700"
          }`}>
            <span className={`text-[11px] font-bold ${
              isWinning ? "text-emerald-400" : isLosing ? "text-rose-400" : "text-zinc-500"
            }`}>
              {isWinning ? "Leading" : isLosing ? "Behind" : "Tied"}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
        </div>
      </motion.div>
    </Link>
  );
}

function OrgCard({
  organizationId,
  name,
  slug,
  role,
  rank,
  rating,
  recentChange,
  streak,
  index,
}: {
  organizationId: string;
  name: string;
  slug: string;
  role: string;
  rank?: number | null;
  rating?: number | null;
  recentChange?: number;
  streak?: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/30"
    >
      <div className="flex items-start justify-between">
        <Link href={`/org/${slug}`} className="flex items-center gap-3 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-800/50 border border-zinc-700 text-[14px] font-bold text-zinc-300">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[15px] font-bold text-white">{name}</p>
            <p className="text-[13px] text-zinc-500">{role}</p>
          </div>
        </Link>
        <InviteButton organizationId={organizationId} orgName={name} />
      </div>

      <Link href={`/org/${slug}`}>
        {(rank || rating) && (
          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-3">
              {rank && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[14px] font-bold tabular-nums ${rank <= 3 ? "text-amber-400" : "text-white"}`}>
                    #{rank}
                  </span>
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[14px] font-bold text-zinc-400 tabular-nums">
                    {Math.round(rating)}
                  </span>
                  {typeof recentChange === "number" && recentChange !== 0 && (
                    <span
                      className={`text-[12px] font-bold tabular-nums ${
                        recentChange > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {recentChange > 0 ? "+" : ""}
                      {recentChange}
                    </span>
                  )}
                </div>
              )}
            </div>
            {typeof streak === "number" && streak >= 3 && (
              <div className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5">
                <Flame className="h-3 w-3 text-orange-400" />
                <span className="text-[11px] font-bold text-orange-400">{streak}</span>
              </div>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    const slug = inviteCode.includes("/")
      ? inviteCode.split("/").filter(Boolean).pop()
      : inviteCode.trim();
    router.push(`/join/${slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
        <Zap className="h-8 w-8 text-orange-400" />
      </div>

      {!showJoin ? (
        <>
          <h2 className="text-xl font-bold text-white">Ready to compete?</h2>
          <p className="mt-2 max-w-xs text-[14px] text-zinc-500">
            Join an organization or create your own to start tracking rankings
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/dashboard/new-org"
              className="rounded-lg bg-orange-500 px-6 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-orange-400"
            >
              Create
            </Link>
            <button
              onClick={() => setShowJoin(true)}
              className="rounded-lg border border-zinc-800 px-6 py-2.5 text-[14px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Join
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleJoin} className="w-full max-w-xs">
          <h2 className="text-xl font-bold text-white">Join organization</h2>
          <input
            type="text"
            placeholder="Paste invite link or org name"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="mt-6 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-[15px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
            autoFocus
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowJoin(false)}
              className="flex-1 rounded-lg border border-zinc-800 py-2.5 text-[14px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim()}
              className="flex-1 rounded-lg bg-orange-500 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-orange-400 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-secondary" />
        <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
                <div className="h-5 w-10 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="h-4 w-32 animate-pulse rounded bg-secondary" />

      {/* Cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-secondary" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                </div>
              </div>
              <div className="h-5 w-5 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Convex queries are automatically real-time (no polling needed!)
  const orgStats = useQuery(api.activity.orgStats);
  const stats = useQuery(api.activity.dashboardStats);
  const activity = useQuery(api.activity.recentActivity);
  const rivalries = useQuery(api.activity.rivalries);
  const rankings = useQuery(api.ratings.myRankings);

  const isLoading = orgStats === undefined || stats === undefined || activity === undefined;

  // Get primary ranking (most recent activity or best rank)
  const primaryRanking = rankings?.[0];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!orgStats || orgStats.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Hero Card - Primary Ranking */}
      <div className="mb-4">
        {primaryRanking ? (
          <HeroCard
            rating={primaryRanking.rating}
            rank={primaryRanking.rank}
            recentChange={primaryRanking.ratingDelta}
            streak={primaryRanking.streak}
            totalWins={primaryRanking.wins}
            totalMatches={primaryRanking.wins + primaryRanking.losses + primaryRanking.draws}
            leaderboardName={primaryRanking.leaderboardName}
            orgName={primaryRanking.organizationName}
          />
        ) : (
          <HeroCardEmpty />
        )}
      </div>

      {/* Gamification Row 1 */}
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StreakWidget />
        <WeeklyLeagueWidget />
      </div>

      {/* Goals & Achievements */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WeeklyGoalsWidget />
        <AchievementsWidget />
      </div>

      {/* Ducking Alert - TODO: implement in Convex */}

      {/* Rivalries */}
      {rivalries && rivalries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="mb-3 flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-zinc-500" />
            <h2 className="text-[15px] font-bold text-white">Top Rivalries</h2>
          </div>
          <div className="space-y-2">
            {rivalries.filter((r) => r !== null).slice(0, 3).map((rivalry, i) => (
              <RivalryCard
                key={`${rivalry.opponentMembershipId}-${rivalry.leaderboardId}`}
                opponentName={rivalry.opponentName}
                orgName={rivalry.orgName}
                orgSlug={rivalry.orgSlug}
                leaderboardName={rivalry.leaderboardName}
                totalMatches={rivalry.totalMatches}
                userWins={rivalry.userWins}
                opponentWins={rivalry.opponentWins}
                draws={rivalry.draws}
                userRating={rivalry.userRating}
                opponentRating={rivalry.opponentRating}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity Feed */}
      {activity && activity.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-bold text-white">Recent Activity</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="divide-y divide-zinc-800/50">
              {activity.slice(0, 5).map((item, i) => (
                <ActivityItem
                  key={i}
                  type={item.type as "win" | "loss" | "draw"}
                  title={item.title}
                  subtitle={item.subtitle}
                  time={item.time}
                  index={i}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Organizations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-bold text-white">Your Organizations</h2>
          <Link
            href="/dashboard/new-org"
            className="text-[13px] font-medium text-orange-400 hover:text-orange-300 transition-colors"
          >
            + New
          </Link>
        </div>
        <div className="space-y-3">
          {orgStats.map((org, i) => (
            <OrgCard
              key={org.organizationId}
              organizationId={org.organizationId}
              name={org.name}
              slug={org.slug}
              role={org.role}
              rank={org.rank}
              rating={org.rating}
              recentChange={org.recentChange}
              streak={org.streak}
              index={i}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
