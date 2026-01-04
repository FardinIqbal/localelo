"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, Shield, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStreak } from "@/lib/streak-utils";

interface StreakProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  freezesAvailable: number;
  weekendAmuletActive: boolean;
  onUseFreeze: () => void;
  isUsingFreeze?: boolean;
}

export function StreakProtectionModal({
  isOpen,
  onClose,
  streak,
  freezesAvailable,
  weekendAmuletActive,
  onUseFreeze,
  isUsingFreeze = false,
}: StreakProtectionModalProps) {
  const canUseFreeze = freezesAvailable > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl border border-border bg-background p-6"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Warning icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertTriangle className="h-8 w-8 text-rose-500" />
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-center text-xl font-bold">
              Streak at Risk!
            </h2>

            {/* Streak display */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <Flame className="h-6 w-6 text-orange-400" />
              <span className="text-2xl font-bold">{streak}</span>
              <span className="text-muted-foreground">day streak</span>
            </div>

            {/* Message */}
            <p className="mb-6 text-center text-sm text-muted-foreground">
              You haven't logged any activity today. Your streak will be lost at
              midnight unless you take action.
            </p>

            {/* Options */}
            <div className="space-y-3">
              {/* Use freeze option */}
              <button
                onClick={onUseFreeze}
                disabled={!canUseFreeze || isUsingFreeze}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 transition-colors",
                  canUseFreeze
                    ? "border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20"
                    : "cursor-not-allowed border-border bg-secondary/50 opacity-50"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                  <Snowflake className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Use a Freeze</p>
                  <p className="text-xs text-muted-foreground">
                    {canUseFreeze
                      ? `${freezesAvailable} freeze${
                          freezesAvailable > 1 ? "s" : ""
                        } available`
                      : "No freezes available"}
                  </p>
                </div>
                {isUsingFreeze && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                )}
              </button>

              {/* Weekend amulet status */}
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4",
                  weekendAmuletActive
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-border bg-secondary/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    weekendAmuletActive
                      ? "bg-emerald-500/20"
                      : "bg-secondary"
                  )}
                >
                  <Shield
                    className={cn(
                      "h-5 w-5",
                      weekendAmuletActive
                        ? "text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Weekend Amulet</p>
                  <p className="text-xs text-muted-foreground">
                    {weekendAmuletActive
                      ? "Auto-protects Saturday & Sunday"
                      : "Disabled - enable in settings"}
                  </p>
                </div>
              </div>

              {/* Log match button */}
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Log a Match Instead
              </button>
            </div>

            {/* Help text */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Earn 1 freeze per week of activity (max 2)
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
