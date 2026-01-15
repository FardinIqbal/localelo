"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Check,
  ChevronDown,
  Flame,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";

function PlayerSelect({
  value,
  onChange,
  players,
  excludeId,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  players: Array<{ id: string; username: string; rating: number }>;
  excludeId?: string;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = players.find((p) => p.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between border-b border-border py-3 text-left text-[15px] transition-colors hover:border-border/80"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? `${selected.username} (${Math.round(selected.rating)})` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-background py-1"
          >
            {players
              .filter((p) => p.id !== excludeId)
              .map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    onChange(player.id);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-[14px] transition-colors hover:bg-secondary"
                >
                  <span>{player.username}</span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {Math.round(player.rating)}
                  </span>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LogMatchModal({
  isOpen,
  onClose,
  leaderboardId,
  players,
}: {
  isOpen: boolean;
  onClose: () => void;
  leaderboardId: string;
  players: Array<{ id: string; username: string; rating: number }>;
}) {
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [result, setResult] = useState<"1" | "2" | "draw" | "">("");
  const [isPending, setIsPending] = useState(false);

  const logMatch = useMutation(api.matches.adminCreate);

  const canSubmit = player1Id && player2Id && result && player1Id !== player2Id;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isPending) return;

    setIsPending(true);
    try {
      await logMatch({
        leaderboardId: leaderboardId as Id<"leaderboards">,
        player1MembershipId: player1Id as Id<"memberships">,
        player2MembershipId: player2Id as Id<"memberships">,
        winnerId: result === "draw" ? undefined : (result === "1" ? player1Id : player2Id) as Id<"memberships">,
      });
      // Convex auto-updates queries, no need to invalidate
      onClose();
      setPlayer1Id("");
      setPlayer2Id("");
      setResult("");
    } finally {
      setIsPending(false);
    }
  };

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm mx-4 p-6 rounded-xl border border-border bg-card"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="text-[17px] font-semibold text-foreground mb-6">Log match</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <PlayerSelect
                value={player1Id}
                onChange={setPlayer1Id}
                players={players}
                excludeId={player2Id}
                placeholder="Select first player"
              />
              <PlayerSelect
                value={player2Id}
                onChange={setPlayer2Id}
                players={players}
                excludeId={player1Id}
                placeholder="Select second player"
              />
            </div>

            {player1Id && player2Id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-[12px] text-muted-foreground">Result</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResult("1")}
                    className={`rounded-lg py-2.5 text-[13px] font-medium transition-all ${
                      result === "1"
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {player1?.username.split(" ")[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("draw")}
                    className={`rounded-lg py-2.5 text-[13px] font-medium transition-all ${
                      result === "draw"
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("2")}
                    className={`rounded-lg py-2.5 text-[13px] font-medium transition-all ${
                      result === "2"
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {player2?.username.split(" ")[0]}
                  </button>
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={!canSubmit || isPending}
              className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
              whileTap={{ scale: 0.98 }}
            >
              {isPending ? "Recording..." : "Record"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RatingDelta({ delta }: { delta: number }) {
  if (delta === 0) return null;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, x: -5 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${
        delta > 0 ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      <motion.span
        initial={{ y: delta > 0 ? 5 : -5 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {delta > 0 ? "+" : ""}{delta}
      </motion.span>
    </motion.span>
  );
}

// Top 3 podium display
function TopThreePodium({
  rankings,
}: {
  rankings: Array<{
    username: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    delta: number;
    streak: number;
  }>;
}) {
  if (rankings.length < 3) return null;

  const [first, second, third] = rankings;
  const podiumOrder = [second, first, third]; // Display order: 2nd, 1st, 3rd

  const heights = ["h-20", "h-28", "h-16"]; // Podium heights
  const ranks = [2, 1, 3];
  const colors = [
    "from-zinc-400/20 to-zinc-400/5 border-zinc-500/30", // Silver
    "from-amber-400/25 to-amber-400/5 border-amber-500/40", // Gold
    "from-orange-600/20 to-orange-600/5 border-orange-600/30", // Bronze
  ];
  const textColors = ["text-zinc-300", "text-amber-400", "text-orange-500"];
  const glowColors = ["", "shadow-amber-500/20", ""];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6"
    >
      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((player, i) => (
          <motion.div
            key={ranks[i]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="flex flex-col items-center"
          >
            {/* Avatar and info */}
            <div className="mb-2 flex flex-col items-center">
              <div
                className={`relative flex ${ranks[i] === 1 ? "h-16 w-16" : "h-12 w-12"} items-center justify-center rounded-full bg-gradient-to-br ${colors[i]} border-2 ${textColors[i].replace("text-", "border-")} text-sm font-black ${textColors[i]} ${glowColors[i] ? `shadow-lg ${glowColors[i]}` : ""}`}
              >
                {player.username.slice(0, 2).toUpperCase()}
                {player.streak >= 3 && (
                  <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/30">
                    <Flame className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-2 max-w-[80px] truncate text-xs font-bold text-white">
                {player.username}
              </p>
              <p className={`font-mono text-xl font-black tabular-nums ${textColors[i]}`}>
                {Math.round(player.rating)}
              </p>
            </div>

            {/* Podium block */}
            <div
              className={`${heights[i]} w-20 rounded-t-lg bg-gradient-to-t ${colors[i]} flex items-center justify-center border-t border-l border-r`}
            >
              <span className={`text-2xl font-black ${textColors[i]}`}>
                {ranks[i]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function RankingRow({
  rank,
  username,
  rating,
  wins,
  losses,
  draws,
  delta,
  streak,
  index,
}: {
  rank: number;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  delta: number;
  streak: number;
  index: number;
}) {
  const totalGames = wins + losses + draws;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-4 px-4 py-4 min-h-[64px] transition-colors hover:bg-zinc-800/50 active:bg-zinc-800/70"
    >
      {/* Rank */}
      <span
        className={`w-8 text-center text-[14px] font-black tabular-nums ${
          rank === 1 ? "text-amber-400" : rank <= 3 ? "text-zinc-400" : "text-zinc-600"
        }`}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-[12px] font-bold text-zinc-400">
        {username.slice(0, 2).toUpperCase()}
        {streak >= 3 && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/30">
            <Flame className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Name and record */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-semibold text-white truncate">{username}</p>
          {streak >= 3 && (
            <span className="text-[11px] font-bold text-orange-400">
              {streak} streak
            </span>
          )}
        </div>
        <p className="text-[12px] text-zinc-500">
          {wins}W - {losses}L{draws > 0 ? ` - ${draws}D` : ""}
          <span className="mx-1.5 text-zinc-700">·</span>
          <span className={`font-bold ${winRate >= 60 ? "text-emerald-400" : winRate <= 40 ? "text-rose-400" : "text-zinc-400"}`}>
            {winRate}%
          </span>
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <motion.span
          className={`font-mono text-[17px] font-black tabular-nums ${
            rank === 1 ? "text-amber-400" : "text-white"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03 + 0.1 }}
        >
          {Math.round(rating)}
        </motion.span>
        <RatingDelta delta={delta} />
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-6 h-4 animate-pulse rounded bg-secondary" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-secondary/50" />
          </div>
          <div className="h-4 w-12 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onLogMatch }: { onLogMatch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <p className="mb-6 text-[14px] text-zinc-500">
        No competitors yet
      </p>
      <button
        onClick={onLogMatch}
        className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-orange-400 shadow-lg shadow-orange-500/20"
      >
        <Plus className="h-3.5 w-3.5" />
        Log first match
      </button>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const leaderboardId = params.id as string;
  const [modalOpen, setModalOpen] = useState(false);

  // Convex queries are real-time - no polling needed
  const leaderboard = useQuery(
    api.leaderboards.get,
    leaderboardId ? { id: leaderboardId as Id<"leaderboards"> } : "skip"
  );
  const leaderboardLoading = leaderboard === undefined;

  const rankings = useQuery(
    api.ratings.getLeaderboard,
    leaderboardId ? { leaderboardId: leaderboardId as Id<"leaderboards"> } : "skip"
  );
  const rankingsLoading = rankings === undefined;

  const players = rankings?.map((r) => ({
    id: r.membership._id as string,
    username: r.membership.username,
    rating: r.rating.rating,
  })) ?? [];

  if (leaderboardLoading) {
    return (
      <div className="mx-auto max-w-xl py-12">
        {/* Back link skeleton */}
        <div className="mb-8 flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-8 animate-pulse rounded bg-secondary" />
        </div>

        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-7 w-40 animate-pulse rounded-lg bg-secondary" />
              <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-full bg-secondary" />
          </div>
        </div>

        {/* Rankings skeleton */}
        <div className="rounded-xl border border-border">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-[17px] font-medium text-foreground">Leaderboard not found</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          It might have been removed.
        </p>
        <Link
          href={`/org/${slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Back to organization
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      <LogMatchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        leaderboardId={leaderboardId}
        players={players}
      />

      {/* Back */}
      <Link
        href={`/org/${slug}`}
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-white">{leaderboard.name}</h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              {rankings?.length ?? 0} competitors
            </p>
          </div>
          {rankings && rankings.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-[12px] font-bold text-white transition-all hover:bg-orange-400 shadow-lg shadow-orange-500/20"
            >
              <Plus className="h-3 w-3" />
              Log match
            </button>
          )}
        </div>
      </motion.div>

      {/* Rankings */}
      {rankingsLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border"
        >
          <LoadingSkeleton />
        </motion.div>
      ) : !rankings || rankings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border"
        >
          <EmptyState onLogMatch={() => setModalOpen(true)} />
        </motion.div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {rankings.length >= 3 && (
            <TopThreePodium
              rankings={rankings.slice(0, 3).map((entry) => ({
                username: entry.membership.username,
                rating: entry.rating.rating,
                wins: entry.rating.wins,
                losses: entry.rating.losses,
                draws: entry.rating.draws,
                delta: entry.recentChange,
                streak: entry.streak,
              }))}
            />
          )}

          {/* Rest of rankings */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50"
          >
            <div className="divide-y divide-zinc-800/50">
              {/* Show all rankings if less than 3, otherwise skip top 3 */}
              {(rankings.length < 3 ? rankings : rankings.slice(3)).map((entry, i) => (
                <RankingRow
                  key={entry.rating._id}
                  rank={rankings.length < 3 ? i + 1 : i + 4}
                  username={entry.membership.username}
                  rating={entry.rating.rating}
                  wins={entry.rating.wins}
                  losses={entry.rating.losses}
                  draws={entry.rating.draws}
                  delta={entry.recentChange}
                  streak={entry.streak}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
