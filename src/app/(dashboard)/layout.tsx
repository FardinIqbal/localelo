"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";
import { UserButton } from "@/components/user-button";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { QuickLogModal } from "@/components/match/quick-log-modal";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [leaderboardPickerOpen, setLeaderboardPickerOpen] = useState(false);
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<string | null>(null);

  // Convex queries are real-time - no polling needed
  const rankings = useQuery(api.ratings.myRankings);

  // Smart play button: skip picker if only one leaderboard
  const handlePlayClick = () => {
    if (rankings && rankings.length === 1) {
      // Skip straight to match logging
      setSelectedLeaderboardId(rankings[0].leaderboardId);
    } else {
      setLeaderboardPickerOpen(true);
    }
  };

  const handleSelectLeaderboard = (leaderboardId: string) => {
    setSelectedLeaderboardId(leaderboardId);
    setLeaderboardPickerOpen(false);
  };

  const handleCloseQuickLog = () => {
    setSelectedLeaderboardId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="text-[15px] font-semibold tracking-tight text-foreground"
          >
            LocalElo
          </Link>
          <UserButton />
        </div>
      </nav>

      {/* Content with bottom padding for nav */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav onPlayClick={handlePlayClick} />

      {/* Leaderboard Picker Modal */}
      <AnimatePresence>
        {leaderboardPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLeaderboardPickerOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-hidden rounded-t-3xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex justify-center py-3">
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="px-4 pb-4">
                <h2 className="text-lg font-semibold text-foreground">Log Match</h2>
                <p className="text-sm text-muted-foreground">Select a leaderboard</p>
              </div>
              <div className="max-h-[50vh] overflow-y-auto px-4 pb-8">
                {!rankings || rankings.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Join a leaderboard to start logging matches
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankings.map((r, i) => (
                      <motion.button
                        key={r.leaderboardId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelectLeaderboard(r.leaderboardId)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                          <Trophy className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-foreground truncate">
                            {r.leaderboardName}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {r.organizationName} · #{r.rank}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={!!selectedLeaderboardId}
        onClose={handleCloseQuickLog}
        leaderboardId={selectedLeaderboardId ?? undefined}
      />
    </div>
  );
}
