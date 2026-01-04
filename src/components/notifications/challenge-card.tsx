"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, Clock, Check, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/hooks/use-haptics";
import { formatDistanceToNow } from "date-fns";

interface ChallengeCardProps {
  challenge: {
    id: string;
    message?: string | null;
    createdAt: Date;
    expiresAt: Date | null;
    challengerMembership?: {
      user: {
        displayName: string | null;
        imageUrl: string | null;
      };
      rating: number;
    };
    challengedMembership?: {
      user: {
        displayName: string | null;
        imageUrl: string | null;
      };
      rating: number;
    };
    leaderboard: {
      name: string;
      organization: {
        name: string;
      };
    };
  };
  type: "received" | "sent" | "active";
  currentUserId?: string;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  onLogMatch?: (id: string) => void;
  isLoading?: boolean;
}

export function ChallengeCard({
  challenge,
  type,
  onAccept,
  onDecline,
  onCancel,
  onLogMatch,
  isLoading = false,
}: ChallengeCardProps) {
  const [showMessage, setShowMessage] = useState(false);

  const opponent =
    type === "received"
      ? challenge.challengerMembership
      : challenge.challengedMembership;

  const timeLeft = challenge.expiresAt
    ? formatDistanceToNow(new Date(challenge.expiresAt), { addSuffix: false })
    : null;

  const isExpiringSoon =
    challenge.expiresAt &&
    new Date(challenge.expiresAt).getTime() - Date.now() < 3600000; // < 1 hour

  const handleAccept = () => {
    triggerHaptic("success");
    onAccept?.(challenge.id);
  };

  const handleDecline = () => {
    triggerHaptic("light");
    onDecline?.(challenge.id);
  };

  const handleCancel = () => {
    triggerHaptic("light");
    onCancel?.(challenge.id);
  };

  const handleLogMatch = () => {
    triggerHaptic("medium");
    onLogMatch?.(challenge.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "rounded-xl border bg-card p-4",
        type === "active" && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Opponent Avatar */}
          <div className="relative">
            {opponent?.user.imageUrl ? (
              <img
                src={opponent.user.imageUrl}
                alt={opponent.user.displayName || "Opponent"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Swords className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {type === "active" && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-amber-500"
              />
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-semibold">
              {opponent?.user.displayName || "Unknown Player"}
            </p>
            <p className="text-sm text-muted-foreground">
              {opponent?.rating ? `${Math.round(opponent.rating)} rating` : ""}
              {opponent?.rating ? " • " : ""}
              {challenge.leaderboard.organization.name}
            </p>
          </div>
        </div>

        {/* Timer */}
        {timeLeft && type !== "active" && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              isExpiringSoon
                ? "bg-rose-500/10 text-rose-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Clock className="h-3 w-3" />
            {timeLeft}
          </div>
        )}
      </div>

      {/* Message */}
      {challenge.message && (
        <motion.div
          initial={false}
          animate={{ height: showMessage ? "auto" : 0 }}
          className="overflow-hidden"
        >
          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
            "{challenge.message}"
          </div>
        </motion.div>
      )}

      {challenge.message && (
        <button
          onClick={() => setShowMessage(!showMessage)}
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-3 w-3" />
          {showMessage ? "Hide message" : "Show message"}
        </button>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {type === "received" && (
          <>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 gap-2"
              size="sm"
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isLoading}
              variant="outline"
              className="flex-1 gap-2"
              size="sm"
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
          </>
        )}

        {type === "sent" && (
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Cancel Challenge
          </Button>
        )}

        {type === "active" && (
          <Button
            onClick={handleLogMatch}
            disabled={isLoading}
            className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
            size="sm"
          >
            <Swords className="h-4 w-4" />
            Log Match Result
          </Button>
        )}
      </div>
    </motion.div>
  );
}
