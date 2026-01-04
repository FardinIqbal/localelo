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
import { trpc } from "@/lib/trpc";
import { InviteButton } from "@/components/invite/invite-modal";

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
    gold: "text-amber-400 bg-amber-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    default: "text-muted-foreground bg-secondary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-3"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className={`rounded-xl p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
          <p className="text-lg font-semibold tracking-tight text-foreground">{value}</p>
          {subtext && <p className="text-[10px] text-muted-foreground/70">{subtext}</p>}
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
    win: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", glow: "shadow-emerald-500/20" },
    loss: { icon: TrendingDown, color: "text-rose-400", bg: "bg-rose-400/10", glow: "shadow-rose-500/20" },
    draw: { icon: Swords, color: "text-muted-foreground", bg: "bg-secondary", glow: "" },
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
      className="flex items-start gap-4 px-4 py-4 transition-colors hover:bg-secondary/50"
    >
      <motion.div
        className={`mt-0.5 rounded-xl p-2 ${bg} ${glow ? `shadow-lg ${glow}` : ""}`}
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
        <p className="text-[14px] font-medium text-foreground">{title}</p>
        <motion.p
          className="text-[13px] text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {ratingChange !== 0 && (
            <span className={`font-medium ${ratingChange > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {ratingChange > 0 ? "+" : ""}{ratingChange}
            </span>
          )}
          {ratingChange !== 0 && " rating in "}
          {subtitle.replace(/[+-]\d+ rating in /, "")}
        </motion.p>
      </div>
      <span className="text-[12px] text-muted-foreground/70 whitespace-nowrap">{time}</span>
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
        className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 transition-colors hover:bg-rose-500/10"
      >
        <div className="rounded-lg bg-rose-500/10 p-2">
          <Target className="h-4 w-4 text-rose-400" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-rose-400">
            Ducking {name}?
          </p>
          <p className="text-[12px] text-muted-foreground">
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
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:bg-secondary/50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-muted-foreground">
          {opponentName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-foreground truncate">{opponentName}</p>
            <span className={`text-[11px] font-medium ${
              isWinning ? "text-emerald-400" : isLosing ? "text-rose-400" : "text-muted-foreground"
            }`}>
              {userWins}-{opponentWins}{draws > 0 ? `-${draws}` : ""}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground/70">
            {leaderboardName} · {totalMatches} matches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${
            isWinning ? "bg-emerald-500/10" : isLosing ? "bg-rose-500/10" : "bg-secondary"
          }`}>
            <span className={`text-[11px] font-medium ${
              isWinning ? "text-emerald-400" : isLosing ? "text-rose-400" : "text-muted-foreground"
            }`}>
              {isWinning ? "Leading" : isLosing ? "Behind" : "Tied"}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
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
      className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/80"
    >
      <div className="flex items-start justify-between">
        <Link href={`/org/${slug}`} className="flex items-center gap-3 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-secondary/80 text-[14px] font-bold text-foreground/80">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">{name}</p>
            <p className="text-[13px] text-muted-foreground">{role}</p>
          </div>
        </Link>
        <InviteButton organizationId={organizationId} orgName={name} />
      </div>

      <Link href={`/org/${slug}`}>
        {(rank || rating) && (
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-3">
              {rank && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[14px] font-semibold ${rank <= 3 ? colors.gold : "text-foreground"}`}>
                    #{rank}
                  </span>
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[14px] text-muted-foreground">
                    {Math.round(rating)}
                  </span>
                  {typeof recentChange === "number" && recentChange !== 0 && (
                    <span
                      className={`text-[12px] font-medium ${
                        recentChange > 0 ? colors.emerald : colors.loss
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
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
                <Flame className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] font-medium text-amber-400">{streak}</span>
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
      <div className="mb-6 rounded-2xl bg-secondary p-4">
        <Zap className="h-8 w-8 text-amber-400" />
      </div>

      {!showJoin ? (
        <>
          <h2 className="text-xl font-semibold text-foreground">Ready to compete?</h2>
          <p className="mt-2 max-w-xs text-[14px] text-muted-foreground">
            Join an organization or create your own to start tracking rankings
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/dashboard/new-org"
              className="rounded-full bg-foreground px-6 py-2.5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Create
            </Link>
            <button
              onClick={() => setShowJoin(true)}
              className="rounded-full border border-border px-6 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
            >
              Join
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleJoin} className="w-full max-w-xs">
          <h2 className="text-xl font-semibold text-foreground">Join organization</h2>
          <input
            type="text"
            placeholder="Paste invite link or org name"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="mt-6 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-center text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border/80"
            autoFocus
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowJoin(false)}
              className="flex-1 rounded-full border border-border py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim()}
              className="flex-1 rounded-full bg-foreground py-2.5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
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
  const { data: orgStats, isLoading: orgStatsLoading } = trpc.activity.orgStats.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.activity.dashboardStats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.activity.recentActivity.useQuery();
  const { data: duckingAlerts } = trpc.activity.duckingAlerts.useQuery();
  const { data: rivalries } = trpc.activity.rivalries.useQuery();

  const isLoading = orgStatsLoading || statsLoading || activityLoading;

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Home</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Your competition hub</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <StatCard
          icon={Trophy}
          label="Best Rank"
          value={stats?.bestRank ? `#${stats.bestRank}` : "-"}
          color={stats?.bestRank && stats.bestRank <= 3 ? "gold" : "default"}
        />
        <StatCard
          icon={Flame}
          label="Win Streak"
          value={stats?.topStreak || 0}
          subtext="wins"
          color={stats?.topStreak && stats.topStreak >= 3 ? "emerald" : "default"}
        />
        <StatCard
          icon={Swords}
          label="This Week"
          value={stats?.matchesThisWeek || 0}
          subtext="matches"
        />
      </div>

      {/* Ducking Alert */}
      {duckingAlerts && duckingAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {duckingAlerts.slice(0, 1).map((alert, i) => (
            <DuckingAlert
              key={i}
              name={alert.name}
              days={alert.days}
              org={alert.org}
              orgSlug={alert.orgSlug}
              leaderboardName={alert.leaderboardName}
            />
          ))}
        </div>
      )}

      {/* Rivalries */}
      {rivalries && rivalries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="mb-3 flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[15px] font-semibold text-foreground">Top Rivalries</h2>
          </div>
          <div className="space-y-2">
            {rivalries.slice(0, 3).map((rivalry, i) => (
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
            <h2 className="text-[15px] font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="divide-y divide-border/50">
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
          <h2 className="text-[15px] font-semibold text-foreground">Your Organizations</h2>
          <Link
            href="/dashboard/new-org"
            className="text-[13px] text-muted-foreground hover:text-foreground"
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
