"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <span className="text-[15px] font-medium tracking-tight">LocalElo</span>
          <Link
            href="/sign-in"
            className="text-[13px] text-zinc-500 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </nav>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-center"
          >
            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-tight sm:text-[56px]">
              Track rankings.
              <br />
              <span className="text-zinc-500">Log matches.</span>
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-zinc-500">
              From dorm room rivalries to gym-wide rankings.
              <br />
              Create a leaderboard in seconds.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition-all hover:bg-zinc-200"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 w-full max-w-lg"
          >
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 backdrop-blur-sm">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-medium">No-Gi Advanced</span>
                <span className="text-[11px] text-zinc-600">12 competitors</span>
              </div>

              {/* Rankings */}
              <div className="space-y-1">
                {[
                  { rank: 1, name: "Marcus Silva", rating: 1847, delta: 24 },
                  { rank: 2, name: "Jake Thompson", rating: 1792, delta: 12 },
                  { rank: 3, name: "Alex Chen", rating: 1756, delta: -8 },
                ].map((player, i) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/30"
                  >
                    <span className={`text-[11px] font-medium tabular-nums ${
                      player.rank === 1 ? "text-amber-500" : "text-zinc-600"
                    }`}>
                      {player.rank}
                    </span>
                    <span className="flex-1 text-[13px]">{player.name}</span>
                    <span className="font-mono text-[13px] text-zinc-400">{player.rating}</span>
                    <span className={`text-[11px] tabular-nums ${
                      player.delta > 0 ? "text-emerald-500" : "text-red-400"
                    }`}>
                      {player.delta > 0 ? "+" : ""}{player.delta}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <p className="text-[11px] text-zinc-700">
            Table tennis · BJJ · Chess · Smash Bros · Any competition
          </p>
        </footer>
      </div>
    </div>
  );
}
