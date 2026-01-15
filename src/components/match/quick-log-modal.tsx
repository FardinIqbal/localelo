"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Minus, XCircle, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { OpponentGrid } from "./opponent-grid";
import { useToast } from "@/components/ui/simple-toast";

type MatchOutcome = "win" | "loss" | "draw";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboardId?: string;
  onSuccess?: () => void;
}

interface Opponent {
  id: string;
  membershipId: string;
  username: string;
  imageUrl?: string | null;
  rating: number;
  matchCount: number;
}

export function QuickLogModal({
  isOpen,
  onClose,
  leaderboardId,
  onSuccess,
}: QuickLogModalProps) {
  const [step, setStep] = useState<"opponent" | "result">("opponent");
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const { toast, toastWithUndo } = useToast();
  const lastMatchIdRef = useRef<string | null>(null);

  // Get recent opponents
  const { data: recentOpponents, isLoading: loadingOpponents } =
    trpc.matches.recentOpponents.useQuery(
      { leaderboardId: leaderboardId ?? "" },
      { enabled: isOpen && !!leaderboardId }
    );

  // Undo mutation
  const undoMatch = trpc.matches.undo.useMutation({
    onSuccess: () => {
      utils.leaderboards.rankings.invalidate();
      utils.matches.recentOpponents.invalidate();
      utils.activity.recentActivity.invalidate();
      utils.rankings.myRankings.invalidate();
      utils.rankings.myRankingsStats.invalidate();
      toast("Match undone", "default");
      if (navigator.vibrate) {
        navigator.vibrate([10, 30, 10]);
      }
    },
    onError: (error) => {
      toast(error.message || "Failed to undo", "error");
    },
  });

  // Get all leaderboard members for search
  const { data: allMembers } = trpc.leaderboards.rankings.useQuery(
    { leaderboardId: leaderboardId ?? "" },
    { enabled: isOpen && !!leaderboardId }
  );

  // Get current user's rating to filter them out of opponents
  const { data: myRating } = trpc.leaderboards.myRating.useQuery(
    { leaderboardId: leaderboardId ?? "" },
    { enabled: isOpen && !!leaderboardId }
  );

  const logMatch = trpc.matches.create.useMutation({
    onSuccess: (data) => {
      // Store match ID for potential undo
      lastMatchIdRef.current = data.id;

      // Invalidate all relevant queries
      utils.leaderboards.rankings.invalidate();
      utils.matches.recentOpponents.invalidate();
      utils.activity.recentActivity.invalidate();
      utils.rankings.myRankings.invalidate();
      utils.rankings.myRankingsStats.invalidate();
      onSuccess?.();
      handleClose();

      // Show rating change feedback with undo option
      const delta = data.ratingDelta;
      const sign = delta >= 0 ? "+" : "";
      const matchId = data.id;

      toastWithUndo(
        `${sign}${delta} rating`,
        delta >= 0 ? "success" : "error",
        () => {
          undoMatch.mutate({ matchId });
        }
      );

      // Haptic feedback for success
      if (navigator.vibrate) {
        navigator.vibrate([10, 50, 10]);
      }
    },
    onError: (error) => {
      console.error("Failed to log match:", error);
      setIsSubmitting(false);
    },
  });

  const handleClose = () => {
    setStep("opponent");
    setSelectedOpponent(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSelectOpponent = (opponent: Opponent) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setSelectedOpponent(opponent);
    setStep("result");
  };

  const handleResult = async (outcome: MatchOutcome) => {
    if (!selectedOpponent || !leaderboardId || isSubmitting) return;

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    setIsSubmitting(true);

    logMatch.mutate({
      leaderboardId,
      opponentMembershipId: selectedOpponent.membershipId,
      outcome,
    });
  };

  const handleBack = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setStep("opponent");
    setSelectedOpponent(null);
  };

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setStep("opponent");
      setSelectedOpponent(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Transform rankings to opponent format (filter out current user)
  const myMembershipId = myRating?.membershipId;
  const opponents: Opponent[] =
    allMembers
      ?.filter((r) => r.membership.id !== myMembershipId)
      .map((r) => ({
        id: r.rating.id,
        membershipId: r.membership.id,
        username: r.membership.username,
        imageUrl: null, // Would come from user data
        rating: r.rating.rating,
        matchCount: 0,
      })) ?? [];

  // Recent opponents with match counts
  const recentWithCounts: Opponent[] =
    recentOpponents?.map((ro) => ({
      id: ro.id,
      membershipId: ro.opponentMembershipId,
      username: ro.opponentUsername,
      imageUrl: null,
      rating: ro.opponentRating ?? 1500,
      matchCount: ro.matchCount,
    })) ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)]"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 pb-4">
              <div className="flex items-center gap-3">
                {step === "result" && (
                  <button
                    onClick={handleBack}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {step === "opponent" ? "Log Match" : "Match Result"}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {step === "opponent"
                      ? "Select your opponent"
                      : `vs ${selectedOpponent?.username}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {step === "opponent" ? (
                  <motion.div
                    key="opponent-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <OpponentGrid
                      recentOpponents={recentWithCounts}
                      allOpponents={opponents}
                      onSelect={handleSelectOpponent}
                      isLoading={loadingOpponents}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="result-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Opponent Preview */}
                    <div className="flex items-center justify-center gap-6 py-6">
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/30 text-lg font-bold text-orange-400">
                          You
                        </div>
                      </div>
                      <span className="text-sm font-bold text-zinc-600 uppercase tracking-wider">
                        vs
                      </span>
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-lg font-bold text-white">
                          {selectedOpponent?.username.charAt(0).toUpperCase()}
                        </div>
                        <p className="mt-2 text-[14px] font-semibold text-white">
                          {selectedOpponent?.username}
                        </p>
                        <p className="font-mono text-[15px] font-bold text-zinc-500 tabular-nums">
                          {Math.round(selectedOpponent?.rating ?? 1500)}
                        </p>
                      </div>
                    </div>

                    {/* Result Buttons - Large for easy tapping */}
                    <div className="grid grid-cols-3 gap-3">
                      <ResultButton
                        outcome="win"
                        icon={Trophy}
                        label="I Won"
                        color="text-emerald-400"
                        bgColor="bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 border-emerald-500/30"
                        glowColor="shadow-emerald-500/20"
                        onClick={() => handleResult("win")}
                        disabled={isSubmitting}
                      />
                      <ResultButton
                        outcome="draw"
                        icon={Minus}
                        label="Draw"
                        color="text-zinc-400"
                        bgColor="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-zinc-700"
                        glowColor=""
                        onClick={() => handleResult("draw")}
                        disabled={isSubmitting}
                      />
                      <ResultButton
                        outcome="loss"
                        icon={XCircle}
                        label="I Lost"
                        color="text-rose-400"
                        bgColor="bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border-rose-500/30"
                        glowColor="shadow-rose-500/20"
                        onClick={() => handleResult("loss")}
                        disabled={isSubmitting}
                      />
                    </div>

                    {isSubmitting && (
                      <div className="flex items-center justify-center gap-2 pt-4 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                        Logging match...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ResultButtonProps {
  outcome: MatchOutcome;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  glowColor: string;
  onClick: () => void;
  disabled?: boolean;
}

function ResultButton({
  icon: Icon,
  label,
  color,
  bgColor,
  glowColor,
  onClick,
  disabled,
}: ResultButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all",
        bgColor,
        glowColor && `shadow-lg ${glowColor}`,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className={cn("h-10 w-10", color)} />
      <span className={cn("text-[15px] font-bold", color)}>{label}</span>
    </motion.button>
  );
}
