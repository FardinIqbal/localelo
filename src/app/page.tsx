"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, QrCode, Users, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Subtle noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Orange glow accent */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-500/8 blur-[120px] rounded-full" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-orange-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">LE</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">LocalElo</span>
        </div>
        <Link
          href="/sign-in"
          className="text-[13px] text-zinc-400 hover:text-white transition-colors duration-200"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-120px)]">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="pt-8 lg:pt-0"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                </span>
                <span className="text-[12px] text-zinc-500 uppercase tracking-wider font-medium">
                  Real-time rankings
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[0.95] tracking-tight">
                Track who&apos;s
                <br />
                <span className="text-orange-500">actually</span> best
              </h1>

              {/* Subhead */}
              <p className="mt-6 text-[17px] leading-relaxed text-zinc-400 max-w-md">
                Elo ratings for your gym, club, or crew.
                Log matches, watch rankings update live.
              </p>

              {/* CTA */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3.5 text-[14px] font-semibold text-black transition-all hover:bg-orange-400 active:scale-[0.98]"
                >
                  Start free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 px-6 py-3.5 text-[14px] font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                >
                  How it works
                </Link>
              </div>

              {/* Social proof */}
              <p className="mt-10 text-[12px] text-zinc-600">
                Used by BJJ gyms, chess clubs, and ping pong leagues
              </p>
            </motion.div>

            {/* Right: Live Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-3xl" />

              {/* Card */}
              <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
                  <div>
                    <h3 className="text-[14px] font-semibold">No-Gi Advanced</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Rolling rankings</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </div>
                </div>

                {/* Rankings */}
                <div className="divide-y divide-zinc-800/30">
                  {[
                    { rank: 1, name: "Marcus Silva", rating: 1847, delta: 24, streak: 5 },
                    { rank: 2, name: "Jake Thompson", rating: 1792, delta: 12, streak: 2 },
                    { rank: 3, name: "Alex Chen", rating: 1756, delta: -8, streak: 0 },
                    { rank: 4, name: "Ryan Park", rating: 1701, delta: 15, streak: 3 },
                  ].map((player, i) => (
                    <motion.div
                      key={player.rank}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition-colors"
                    >
                      {/* Rank */}
                      <span className={`w-6 text-center text-[13px] font-bold tabular-nums ${
                        player.rank === 1 ? "text-orange-500" : "text-zinc-600"
                      }`}>
                        {player.rank}
                      </span>

                      {/* Avatar */}
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-semibold ${
                        player.rank === 1
                          ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {player.name.split(" ").map(n => n[0]).join("")}
                      </div>

                      {/* Name + Streak */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{player.name}</p>
                        {player.streak >= 3 && (
                          <p className="text-[10px] text-orange-400/80 mt-0.5">
                            {player.streak} win streak
                          </p>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="text-right">
                        <p className="text-[14px] font-mono font-semibold tabular-nums text-zinc-200">
                          {player.rating}
                        </p>
                        <p className={`text-[11px] font-mono tabular-nums ${
                          player.delta > 0 ? "text-emerald-500" : "text-red-400"
                        }`}>
                          {player.delta > 0 ? "+" : ""}{player.delta}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800/50">
                  <p className="text-[11px] text-zinc-600 text-center">
                    12 competitors this week
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Strip */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-20 border-t border-zinc-900"
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
              {[
                {
                  icon: Zap,
                  title: "Instant updates",
                  desc: "Ratings recalculate the moment you log a match. No refresh needed."
                },
                {
                  icon: QrCode,
                  title: "QR invites",
                  desc: "Generate a code, scan to join. New members onboard in seconds."
                },
                {
                  icon: Users,
                  title: "Multiple boards",
                  desc: "Separate rankings for gi, no-gi, beginner, advanced. Your rules."
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <feature.icon className="h-5 w-5 text-orange-500 mb-4" />
                  <h3 className="text-[15px] font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section
          id="how"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-20 scroll-mt-20"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[12px] text-zinc-500 uppercase tracking-wider font-medium mb-12 text-center">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  title: "Create your group",
                  desc: "Name it, set up leaderboards for each activity or skill level.",
                },
                {
                  num: "02",
                  title: "Invite your crew",
                  desc: "Share a link or QR code. They pick a username and they're in.",
                },
                {
                  num: "03",
                  title: "Log matches",
                  desc: "Tap opponent, tap result. Elo ratings update automatically.",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
                >
                  <span className="text-[11px] font-mono text-orange-500/60 mb-4 block">
                    {step.num}
                  </span>
                  <h3 className="text-[15px] font-semibold mb-2">{step.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-24 text-center"
        >
          <div className="max-w-md mx-auto">
            <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mb-4">
              Ready to rank?
            </h2>
            <p className="text-[15px] text-zinc-500 mb-8">
              Free for groups under 20. Set up takes 60 seconds.
            </p>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-[14px] font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
            >
              Create your leaderboard
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-zinc-800 flex items-center justify-center">
              <span className="text-[8px] font-bold text-zinc-500">LE</span>
            </div>
            <span className="text-[13px] text-zinc-600">LocalElo</span>
          </div>
          <p className="text-[11px] text-zinc-700">
            Built for competitors.
          </p>
        </div>
      </footer>
    </div>
  );
}
