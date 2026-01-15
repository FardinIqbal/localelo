"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Opponent {
  id: string;
  membershipId: string;
  username: string;
  imageUrl?: string | null;
  rating: number;
  matchCount: number;
}

interface OpponentGridProps {
  recentOpponents: Opponent[];
  allOpponents: Opponent[];
  onSelect: (opponent: Opponent) => void;
  isLoading?: boolean;
}

export function OpponentGrid({
  recentOpponents,
  allOpponents,
  onSelect,
  isLoading,
}: OpponentGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Filter opponents based on search
  const filteredOpponents = searchQuery
    ? allOpponents.filter((o) =>
        o.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : showAll
    ? allOpponents
    : recentOpponents.slice(0, 6);

  const hasRecent = recentOpponents.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex h-24 animate-pulse flex-col items-center justify-center rounded-xl bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search opponents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {/* Section Header */}
      {!searchQuery && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          {hasRecent && !showAll ? (
            <>
              <Clock className="h-4 w-4" />
              <span className="font-medium">Recent Opponents</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              <span className="font-medium">All Members</span>
            </>
          )}
        </div>
      )}

      {/* Opponent Grid - Large touch targets for gym use */}
      <div className="grid grid-cols-3 gap-3">
        {filteredOpponents.map((opponent, index) => (
          <motion.button
            key={opponent.membershipId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelect(opponent)}
            className="group relative flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 transition-all hover:border-orange-500/50 hover:bg-zinc-800 active:bg-zinc-700"
          >
            {/* Avatar - Larger for easy tapping */}
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 border border-zinc-600 text-xl font-bold text-zinc-300 group-hover:border-orange-500/50 group-hover:text-orange-400 transition-colors">
              {opponent.imageUrl ? (
                <img
                  src={opponent.imageUrl}
                  alt={opponent.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                opponent.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* Username */}
            <span className="max-w-full truncate text-[14px] font-semibold text-white">
              {opponent.username}
            </span>

            {/* Rating */}
            <span className="text-[13px] font-mono font-bold text-zinc-500 tabular-nums">
              {Math.round(opponent.rating)}
            </span>

            {/* Match count badge */}
            {opponent.matchCount > 0 && (
              <div className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white shadow-lg shadow-orange-500/30">
                {opponent.matchCount}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Empty State */}
      {filteredOpponents.length === 0 && (
        <div className="py-8 text-center text-zinc-500">
          <p className="font-medium">No opponents found</p>
          {searchQuery && (
            <p className="mt-1 text-sm">Try a different search term</p>
          )}
        </div>
      )}

      {/* Toggle Button */}
      {!searchQuery && hasRecent && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {showAll ? "Show Recent Only" : `Show All (${allOpponents.length})`}
        </button>
      )}
    </div>
  );
}
