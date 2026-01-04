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
import { trpc } from "@/lib/trpc";

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

  const utils = trpc.useUtils();
  const logMatch = trpc.matches.adminCreate.useMutation({
    onSuccess: () => {
      utils.leaderboards.rankings.invalidate({ leaderboardId });
      utils.matches.byLeaderboard.invalidate({ leaderboardId });
      onClose();
      setPlayer1Id("");
      setPlayer2Id("");
      setResult("");
    },
  });

  const canSubmit = player1Id && player2Id && result && player1Id !== player2Id;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    logMatch.mutate({
      leaderboardId,
      player1MembershipId: player1Id,
      player2MembershipId: player2Id,
      winnerId: result === "draw" ? null : result === "1" ? player1Id : player2Id,
    });
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
              disabled={!canSubmit || logMatch.isPending}
              className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
              whileTap={{ scale: 0.98 }}
            >
              {logMatch.isPending ? "Recording..." : "Record"}
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
      className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/50"
    >
      {/* Rank */}
      <span
        className={`w-6 text-center text-[12px] font-medium tabular-nums ${
          rank === 1 ? "text-amber-400" : rank <= 3 ? "text-muted-foreground" : "text-muted-foreground/60"
        }`}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
        {username.slice(0, 2).toUpperCase()}
        {streak >= 3 && (
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
            <Flame className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Name and record */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium text-foreground truncate">{username}</p>
          {streak >= 3 && (
            <span className="text-[10px] font-medium text-amber-400">
              {streak} streak
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          {wins}W - {losses}L{draws > 0 ? ` - ${draws}D` : ""}
          <span className="mx-1">·</span>
          <span className={winRate >= 60 ? "text-emerald-400" : winRate <= 40 ? "text-rose-400" : ""}>
            {winRate}%
          </span>
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <motion.span
          className={`font-mono text-[15px] font-semibold tabular-nums text-foreground ${
            rank === 1 ? "text-amber-400" : ""
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
      <p className="mb-6 text-[14px] text-muted-foreground">
        No competitors yet
      </p>
      <button
        onClick={onLogMatch}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
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

  const { data: leaderboard, isLoading: leaderboardLoading } =
    trpc.leaderboards.getById.useQuery(
      { id: leaderboardId },
      { enabled: !!leaderboardId }
    );

  const { data: rankings, isLoading: rankingsLoading } =
    trpc.leaderboards.rankings.useQuery(
      { leaderboardId },
      { enabled: !!leaderboardId }
    );

  const players = rankings?.map((r) => ({
    id: r.membership.id,
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
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
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
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{leaderboard.name}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {rankings?.length ?? 0} competitors
            </p>
          </div>
          {rankings && rankings.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Plus className="h-3 w-3" />
              Log match
            </button>
          )}
        </div>
      </motion.div>

      {/* Rankings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border"
      >
        {rankingsLoading ? (
          <LoadingSkeleton />
        ) : !rankings || rankings.length === 0 ? (
          <EmptyState onLogMatch={() => setModalOpen(true)} />
        ) : (
          <div className="divide-y divide-border/50">
            {rankings.map((entry, i) => (
              <RankingRow
                key={entry.rating.id}
                rank={i + 1}
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
        )}
      </motion.div>
    </div>
  );
}
