"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingTickProps {
  change: number;
  duration?: number;
  onComplete?: () => void;
  position?: "center" | "top-right" | "inline";
}

export function RatingTick({
  change,
  duration = 2000,
  onComplete,
  position = "center",
}: RatingTickProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [displayValue, setDisplayValue] = useState(0);

  const isPositive = change > 0;
  const isNegative = change < 0;
  const absChange = Math.abs(change);

  // Animate the number counting up/down
  useEffect(() => {
    const startTime = Date.now();
    const tickDuration = 500; // Time to count up

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / tickDuration, 1);

      // Easing function (ease out)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(absChange * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [absChange]);

  // Auto-hide after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const positionClasses = {
    center: "fixed inset-0 flex items-center justify-center z-[99]",
    "top-right": "fixed top-20 right-4 z-[99]",
    inline: "relative",
  };

  const Icon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  const colorClasses = isPositive
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : isNegative
    ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
    : "text-muted-foreground bg-secondary border-border";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={positionClasses[position]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.5, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-6 py-4",
              colorClasses,
              position === "center" && "shadow-2xl"
            )}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Icon className="h-8 w-8" />
            </motion.div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums">
                {isPositive ? "+" : isNegative ? "-" : ""}
                {displayValue}
              </span>
              <span className="text-sm opacity-80">rating</span>
            </div>
          </motion.div>

          {/* Background overlay for center position */}
          {position === "center" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 bg-black/40 backdrop-blur-sm"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mini version for inline use
interface RatingDeltaProps {
  change: number;
  animate?: boolean;
}

export function RatingDelta({ change, animate = true }: RatingDeltaProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  const Icon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : null;

  const colorClasses = isPositive
    ? "text-emerald-400"
    : isNegative
    ? "text-rose-400"
    : "text-muted-foreground";

  if (change === 0) return null;

  const content = (
    <span className={cn("inline-flex items-center gap-0.5 text-sm", colorClasses)}>
      {Icon && <Icon className="h-3 w-3" />}
      <span className="font-medium tabular-nums">
        {isPositive ? "+" : ""}
        {Math.round(change)}
      </span>
    </span>
  );

  if (animate) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {content}
      </motion.span>
    );
  }

  return content;
}
