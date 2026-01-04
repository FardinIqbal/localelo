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
              className="flex h-24 animate-pulse flex-col items-center justify-center rounded-2xl bg-secondary"
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search opponents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Section Header */}
      {!searchQuery && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasRecent && !showAll ? (
            <>
              <Clock className="h-4 w-4" />
              <span>Recent Opponents</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              <span>All Members</span>
            </>
          )}
        </div>
      )}

      {/* Opponent Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredOpponents.map((opponent, index) => (
          <motion.button
            key={opponent.membershipId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(opponent)}
            className="group relative flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-secondary"
          >
            {/* Avatar */}
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold group-hover:bg-primary/10 group-hover:text-primary">
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
            <span className="max-w-full truncate text-sm font-medium">
              {opponent.username}
            </span>

            {/* Rating */}
            <span className="text-xs text-muted-foreground">
              {Math.round(opponent.rating)}
            </span>

            {/* Match count badge */}
            {opponent.matchCount > 0 && (
              <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {opponent.matchCount}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Empty State */}
      {filteredOpponents.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <p>No opponents found</p>
          {searchQuery && (
            <p className="mt-1 text-sm">Try a different search term</p>
          )}
        </div>
      )}

      {/* Toggle Button */}
      {!searchQuery && hasRecent && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          {showAll ? "Show Recent Only" : `Show All (${allOpponents.length})`}
        </button>
      )}
    </div>
  );
}
