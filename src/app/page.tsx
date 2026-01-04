"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, QrCode, Trophy, Users, Zap, TrendingUp, Share2 } from "lucide-react";

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

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

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
        <main className="flex flex-1 flex-col items-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl text-center pt-12 md:pt-20"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-zinc-400">Free forever for small groups</span>
            </div>

            <h1 className="text-[38px] font-semibold leading-[1.1] tracking-tight sm:text-[56px]">
              Elo rankings for
              <br />
              <span className="text-zinc-500">real-world competition</span>
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-zinc-500 max-w-md mx-auto">
              Turn your BJJ gym, chess club, or ping pong table into a competitive league.
              Track matches, see rankings update instantly.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition-all hover:bg-zinc-200"
              >
                Start free
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-5 py-2.5 text-[13px] font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
              >
                See how it works
              </Link>
            </motion.div>
          </motion.div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 w-full max-w-lg"
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
                  { rank: 1, name: "Marcus Silva", rating: 1847, delta: 24, streak: 5 },
                  { rank: 2, name: "Jake Thompson", rating: 1792, delta: 12, streak: 0 },
                  { rank: 3, name: "Alex Chen", rating: 1756, delta: -8, streak: 0 },
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
                    {player.streak >= 3 && (
                      <span className="text-[10px] text-orange-400">🔥{player.streak}</span>
                    )}
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

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl"
          >
            {[
              { icon: Zap, label: "Instant updates", desc: "Ratings adjust in real-time" },
              { icon: QrCode, label: "QR invites", desc: "Scan to join a group" },
              { icon: Users, label: "Multiple groups", desc: "Gym, office, friends" },
              { icon: TrendingUp, label: "Win streaks", desc: "Track hot streaks" },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center p-4"
              >
                <feature.icon className="h-5 w-5 mx-auto mb-2 text-zinc-500" />
                <p className="text-[13px] font-medium text-zinc-300">{feature.label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How it works */}
          <motion.section
            id="how-it-works"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 w-full max-w-2xl scroll-mt-20"
          >
            <h2 className="text-center text-[13px] font-medium text-zinc-500 uppercase tracking-wider mb-10">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Create a group",
                  desc: "Name your organization and add leaderboards for different activities.",
                },
                {
                  step: "2",
                  title: "Invite members",
                  desc: "Share a QR code or link. Anyone can scan and join instantly.",
                },
                {
                  step: "3",
                  title: "Log matches",
                  desc: "Record wins, losses, or draws. Elo ratings update automatically.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 text-[13px] font-medium text-zinc-500 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-[15px] font-medium text-zinc-200 mb-2">{item.title}</h3>
                  <p className="text-[13px] text-zinc-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Use cases */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 w-full max-w-xl"
          >
            <h2 className="text-center text-[13px] font-medium text-zinc-500 uppercase tracking-wider mb-8">
              Perfect for
            </h2>

            <div className="flex flex-wrap justify-center gap-2">
              {[
                "BJJ gyms",
                "Chess clubs",
                "Ping pong leagues",
                "Fighting game crews",
                "Office competitions",
                "Dorm rivalries",
                "Pool tables",
                "Board game nights",
              ].map((useCase, i) => (
                <motion.span
                  key={useCase}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-[12px] text-zinc-400"
                >
                  {useCase}
                </motion.span>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 mb-16 text-center"
          >
            <h2 className="text-[24px] font-semibold tracking-tight mb-3">
              Ready to compete?
            </h2>
            <p className="text-[14px] text-zinc-500 mb-6">
              Create your first leaderboard in under a minute.
            </p>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-all hover:bg-zinc-200"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-zinc-900">
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[13px] text-zinc-600">LocalElo</span>
            <p className="text-[11px] text-zinc-700">
              Built for competitors, by competitors.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
