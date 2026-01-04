"use client";

import { useState, useEffect } from "react";
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
  const { toast } = useToast();

  // Get recent opponents
  const { data: recentOpponents, isLoading: loadingOpponents } =
    trpc.matches.recentOpponents.useQuery(
      { leaderboardId: leaderboardId ?? "" },
      { enabled: isOpen && !!leaderboardId }
    );

  // Get all leaderboard members for search
  const { data: allMembers } = trpc.leaderboards.rankings.useQuery(
    { leaderboardId: leaderboardId ?? "" },
    { enabled: isOpen && !!leaderboardId }
  );

  const logMatch = trpc.matches.create.useMutation({
    onSuccess: (data) => {
      // Invalidate all relevant queries
      utils.leaderboards.rankings.invalidate();
      utils.matches.recentOpponents.invalidate();
      utils.activity.recentActivity.invalidate();
      utils.rankings.myRankings.invalidate();
      utils.rankings.myRankingsStats.invalidate();
      onSuccess?.();
      handleClose();
      // Show rating change feedback
      const delta = data.ratingDelta;
      const sign = delta >= 0 ? "+" : "";
      toast(`${sign}${delta} rating`, delta >= 0 ? "success" : "error");
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

  // Transform rankings to opponent format
  const opponents: Opponent[] =
    allMembers?.map((r) => ({
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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 pb-4">
              <div className="flex items-center gap-3">
                {step === "result" && (
                  <button
                    onClick={handleBack}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-semibold">
                    {step === "opponent" ? "Log Match" : "Match Result"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {step === "opponent"
                      ? "Select your opponent"
                      : `vs ${selectedOpponent?.username}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary"
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
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          You
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground/60">
                        vs
                      </span>
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-foreground">
                          {selectedOpponent?.username.charAt(0).toUpperCase()}
                        </div>
                        <p className="mt-2 text-[14px] font-medium text-foreground">
                          {selectedOpponent?.username}
                        </p>
                        <p className="font-mono text-[15px] font-semibold text-muted-foreground">
                          {Math.round(selectedOpponent?.rating ?? 1500)}
                        </p>
                      </div>
                    </div>

                    {/* Result Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <ResultButton
                        outcome="win"
                        icon={Trophy}
                        label="I Won"
                        color="text-emerald-500"
                        bgColor="bg-emerald-500/10 hover:bg-emerald-500/20"
                        onClick={() => handleResult("win")}
                        disabled={isSubmitting}
                      />
                      <ResultButton
                        outcome="draw"
                        icon={Minus}
                        label="Draw"
                        color="text-amber-500"
                        bgColor="bg-amber-500/10 hover:bg-amber-500/20"
                        onClick={() => handleResult("draw")}
                        disabled={isSubmitting}
                      />
                      <ResultButton
                        outcome="loss"
                        icon={XCircle}
                        label="I Lost"
                        color="text-rose-500"
                        bgColor="bg-rose-500/10 hover:bg-rose-500/20"
                        onClick={() => handleResult("loss")}
                        disabled={isSubmitting}
                      />
                    </div>

                    {isSubmitting && (
                      <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
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
  onClick: () => void;
  disabled?: boolean;
}

function ResultButton({
  icon: Icon,
  label,
  color,
  bgColor,
  onClick,
  disabled,
}: ResultButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border border-border p-4 transition-colors",
        bgColor,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className={cn("h-8 w-8", color)} />
      <span className={cn("text-sm font-medium", color)}>{label}</span>
    </motion.button>
  );
}
