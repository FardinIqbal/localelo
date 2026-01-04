"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [playModalOpen, setPlayModalOpen] = useState(false);

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
      <BottomNav onPlayClick={() => setPlayModalOpen(true)} />

      {/* Quick Play Modal - will be implemented in Phase 2 */}
      {playModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPlayModalOpen(false)}
        >
          <div
            className="rounded-2xl border border-border bg-card p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-medium">Quick Match</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Coming in Phase 2
            </p>
            <button
              onClick={() => setPlayModalOpen(false)}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
