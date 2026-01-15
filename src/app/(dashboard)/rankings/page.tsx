"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  ChevronRight,
  ChevronDown,
  Target,
  TrendingUp,
  TrendingDown,
  Filter,
  Swords,
  Medal,
  Crown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

type SortOption = "recent" | "rank" | "rating" | "active";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-secondary" />
        <div className="h-4 w-48 animate-pulse rounded bg-secondary" />
      </div>

      {/* Stats card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
                <div className="h-6 w-12 animate-pulse rounded bg-secondary" />
                <div className="h-2 w-20 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
          <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
        </div>
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-secondary" />
        ))}
      </div>

      {/* Sort row skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-28 animate-pulse rounded bg-secondary" />
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-36 animate-pulse rounded bg-secondary" />
                  <div className="h-5 w-10 animate-pulse rounded-full bg-secondary" />
                </div>
                <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
              </div>
              <div className="h-5 w-5 animate-pulse rounded bg-secondary" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-5 w-14 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyRankings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-6 rounded-2xl bg-secondary p-4">
        <Trophy className="h-8 w-8 text-amber-400" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">No rankings yet</h2>
      <p className="mt-2 max-w-xs text-[14px] text-muted-foreground">
        Join a leaderboard and play some matches to start building your rankings
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-foreground px-6 py-2.5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Browse Organizations
        </Link>
      </div>
    </motion.div>
  );
}

function RankingsStatsCard({
  bestRank,
  bestRankLeaderboard,
  totalLeaderboards,
  totalOrganizations,
  winRate,
  totalWins,
  totalLosses,
}: {
  bestRank: number | null;
  bestRankLeaderboard: string | null;
  totalLeaderboards: number;
  totalOrganizations: number;
  winRate: number | null;
  totalWins: number;
  totalLosses: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-400/10 p-2.5">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground">Best Rank</p>
            <p className="text-xl font-semibold tracking-tight text-foreground">
              {bestRank ? `#${bestRank}` : "-"}
            </p>
            {bestRankLeaderboard && (
              <p className="text-[11px] text-muted-foreground/70 truncate max-w-[100px]">
                {bestRankLeaderboard}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-400/10 p-2.5">
            <Target className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground">Win Rate</p>
            <p className="text-xl font-semibold tracking-tight text-foreground">
              {winRate !== null ? `${winRate}%` : "-"}
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              {totalWins}W - {totalLosses}L
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
        <div className="flex items-center gap-1.5">
          <Medal className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] text-foreground font-medium">{totalLeaderboards}</span>
          <span className="text-[13px] text-muted-foreground">leaderboards</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-muted-foreground">across</span>
          <span className="text-[13px] text-foreground font-medium">{totalOrganizations}</span>
          <span className="text-[13px] text-muted-foreground">orgs</span>
        </div>
      </div>
    </motion.div>
  );
}

function OrgFilterPills({
  organizations,
  selectedOrg,
  onSelectOrg,
}: {
  organizations: { id: string; name: string; count: number }[];
  selectedOrg: string | null;
  onSelectOrg: (orgId: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelectOrg(null)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
          selectedOrg === null
            ? "bg-foreground text-background"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        }`}
      >
        All
      </button>
      {organizations.map((org) => (
        <button
          key={org.id}
          onClick={() => onSelectOrg(org.id)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
            selectedOrg === org.id
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          }`}
        >
          {org.name}
          <span className="ml-1 text-[11px] opacity-70">({org.count})</span>
        </button>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5">
        <Crown className="h-3 w-3 text-amber-400" />
        <span className="text-[11px] font-bold text-amber-400">#1</span>
      </div>
    );
  }
  if (rank <= 3) {
    return (
      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-bold text-amber-400">
        #{rank}
      </span>
    );
  }
  if (rank <= 10) {
    return (
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
        #{rank}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium text-muted-foreground">#{rank}</span>
  );
}

function LeaderboardPreviewRow({
  rank,
  username,
  rating,
  isCurrentUser,
}: {
  rank: number;
  username: string;
  rating: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isCurrentUser ? "bg-primary/5 -mx-3 px-3 rounded-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-6 text-[12px] font-medium ${
          rank <= 3 ? "text-amber-400" : "text-muted-foreground"
        }`}>
          #{rank}
        </span>
        <span className={`text-[13px] ${isCurrentUser ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
          {username}
          {isCurrentUser && <span className="ml-1 text-[11px] text-primary">(you)</span>}
        </span>
      </div>
      <span className="font-mono text-[13px] text-foreground">{rating}</span>
    </div>
  );
}

function LeaderboardSummaryCard({
  leaderboardId,
  leaderboardName,
  organizationName,
  organizationSlug,
  rank,
  totalCompetitors,
  rating,
  ratingDelta,
  wins,
  losses,
  draws,
  streak,
  lastMatchDate,
  isExpanded,
  onToggle,
  index,
}: {
  leaderboardId: string;
  leaderboardName: string;
  organizationName: string;
  organizationSlug: string;
  rank: number;
  totalCompetitors: number;
  rating: number;
  ratingDelta: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  lastMatchDate: Date | null;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const { data: preview, isLoading: previewLoading } = trpc.rankings.leaderboardPreview.useQuery(
    { leaderboardId },
    { enabled: isExpanded }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Main Card Content */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-foreground truncate">
                {leaderboardName}
              </h3>
              <RankBadge rank={rank} />
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{organizationName}</p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Stats Row */}
        <div className="mt-3 flex items-center gap-4">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[17px] font-semibold text-foreground">
              {Math.round(rating)}
            </span>
            {ratingDelta !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-[12px] font-medium ${
                  ratingDelta > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {ratingDelta > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {ratingDelta > 0 ? "+" : ""}{ratingDelta}
              </span>
            )}
          </div>

          {/* Streak */}
          {streak >= 3 && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
              <Flame className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-400">{streak}</span>
            </div>
          )}

          {/* Record */}
          <span className="text-[12px] text-muted-foreground">
            {wins}W-{losses}L{draws > 0 ? `-${draws}D` : ""}
          </span>

          {/* Rank Position */}
          <span className="text-[12px] text-muted-foreground ml-auto">
            {rank} of {totalCompetitors}
          </span>
        </div>
      </button>

      {/* Expanded Preview */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50 overflow-hidden"
          >
            <div className="p-4">
              {previewLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-secondary" />
                  ))}
                </div>
              ) : preview ? (
                <>
                  {/* Top 3 */}
                  <div className="space-y-1">
                    {preview.top3.map((entry) => (
                      <LeaderboardPreviewRow
                        key={entry.rank}
                        rank={entry.rank}
                        username={entry.username}
                        rating={entry.rating}
                        isCurrentUser={entry.isCurrentUser}
                      />
                    ))}
                  </div>

                  {/* User Context if not in top 3 */}
                  {preview.userContext && preview.userContext.user.rank > 3 && (
                    <>
                      <div className="my-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-[11px] text-muted-foreground">...</span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                      {preview.userContext.aboveUser && (
                        <LeaderboardPreviewRow
                          rank={preview.userContext.aboveUser.rank}
                          username={preview.userContext.aboveUser.username}
                          rating={preview.userContext.aboveUser.rating}
                          isCurrentUser={false}
                        />
                      )}
                      <LeaderboardPreviewRow
                        rank={preview.userContext.user.rank}
                        username={preview.userContext.user.username}
                        rating={preview.userContext.user.rating}
                        isCurrentUser={true}
                      />
                      {preview.userContext.belowUser && (
                        <LeaderboardPreviewRow
                          rank={preview.userContext.belowUser.rank}
                          username={preview.userContext.belowUser.username}
                          rating={preview.userContext.belowUser.rating}
                          isCurrentUser={false}
                        />
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/org/${organizationSlug}/leaderboard/${leaderboardId}`}
                      className="flex-1 rounded-xl bg-secondary py-2.5 text-center text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                      View Full Leaderboard
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RankingsPage() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const { data: rankings, isLoading: rankingsLoading } = trpc.rankings.myRankings.useQuery(
    undefined,
    { refetchInterval: 15000 } // Live updates every 15s
  );
  const { data: stats, isLoading: statsLoading } = trpc.rankings.myRankingsStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const isLoading = rankingsLoading || statsLoading;

  // Extract unique organizations
  const organizations = useMemo(() => {
    if (!rankings) return [];
    const orgMap = new Map<string, { id: string; name: string; count: number }>();
    rankings.forEach((r) => {
      const existing = orgMap.get(r.organizationId);
      if (existing) {
        existing.count++;
      } else {
        orgMap.set(r.organizationId, {
          id: r.organizationId,
          name: r.organizationName,
          count: 1,
        });
      }
    });
    return Array.from(orgMap.values());
  }, [rankings]);

  // Filter and sort rankings
  const filteredRankings = useMemo(() => {
    if (!rankings) return [];

    let filtered = selectedOrg
      ? rankings.filter((r) => r.organizationId === selectedOrg)
      : rankings;

    // Sort based on selected option
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rank":
          return a.rank - b.rank;
        case "rating":
          return b.rating - a.rating;
        case "active":
          return (b.wins + b.losses + b.draws) - (a.wins + a.losses + a.draws);
        case "recent":
        default:
          if (a.lastMatchDate && b.lastMatchDate) {
            return new Date(b.lastMatchDate).getTime() - new Date(a.lastMatchDate).getTime();
          }
          if (a.lastMatchDate && !b.lastMatchDate) return -1;
          if (!a.lastMatchDate && b.lastMatchDate) return 1;
          return a.rank - b.rank;
      }
    });
  }, [rankings, selectedOrg, sortBy]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rankings</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Your rankings across all leaderboards</p>
        </motion.div>
        <EmptyRankings />
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rankings</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Your rankings across all leaderboards</p>
      </motion.div>

      {/* Stats Card */}
      {stats && (
        <div className="mb-6">
          <RankingsStatsCard
            bestRank={stats.bestRank}
            bestRankLeaderboard={stats.bestRankLeaderboard}
            totalLeaderboards={stats.totalLeaderboards}
            totalOrganizations={stats.totalOrganizations}
            winRate={stats.winRate}
            totalWins={stats.totalWins}
            totalLosses={stats.totalLosses}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <OrgFilterPills
          organizations={organizations}
          selectedOrg={selectedOrg}
          onSelectOrg={setSelectedOrg}
        />
      </div>

      {/* Sort Options */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">
          {filteredRankings.length} leaderboard{filteredRankings.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-[13px] text-muted-foreground outline-none cursor-pointer"
          >
            <option value="recent">Recent Activity</option>
            <option value="rank">Best Rank</option>
            <option value="rating">Highest Rating</option>
            <option value="active">Most Active</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {filteredRankings.map((ranking, index) => (
          <LeaderboardSummaryCard
            key={ranking.leaderboardId}
            leaderboardId={ranking.leaderboardId}
            leaderboardName={ranking.leaderboardName}
            organizationName={ranking.organizationName}
            organizationSlug={ranking.organizationSlug}
            rank={ranking.rank}
            totalCompetitors={ranking.totalCompetitors}
            rating={ranking.rating}
            ratingDelta={ranking.ratingDelta}
            wins={ranking.wins}
            losses={ranking.losses}
            draws={ranking.draws}
            streak={ranking.streak}
            lastMatchDate={ranking.lastMatchDate}
            isExpanded={expandedCard === ranking.leaderboardId}
            onToggle={() =>
              setExpandedCard(
                expandedCard === ranking.leaderboardId ? null : ranking.leaderboardId
              )
            }
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
