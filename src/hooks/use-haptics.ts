"use client";

import { useCallback } from "react";

// Haptic patterns for different interactions
export type HapticPattern =
  | "light" // Light tap (navigation, selections)
  | "medium" // Medium feedback (confirmations)
  | "heavy" // Strong feedback (success, achievements)
  | "success" // Success pattern (win, milestone)
  | "warning" // Warning pattern (at risk, error)
  | "error" // Error pattern (failure)
  | "celebration"; // Celebration pattern (major achievement)

// Pattern definitions in milliseconds
// [vibrate, pause, vibrate, pause, ...]
const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 20],
  warning: [30, 50, 30],
  error: [50, 30, 50, 30, 50],
  celebration: [10, 30, 20, 30, 30, 30, 40],
};

export function useHaptics() {
  const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  const trigger = useCallback(
    (pattern: HapticPattern = "light") => {
      if (!isSupported) return;

      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // Silently fail if vibration fails
      }
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;

    try {
      navigator.vibrate(0);
    } catch {
      // Silently fail
    }
  }, [isSupported]);

  return {
    isSupported,
    trigger,
    stop,
    // Convenience methods
    light: () => trigger("light"),
    medium: () => trigger("medium"),
    heavy: () => trigger("heavy"),
    success: () => trigger("success"),
    warning: () => trigger("warning"),
    error: () => trigger("error"),
    celebration: () => trigger("celebration"),
  };
}

// Standalone function for use outside React components
export function triggerHaptic(pattern: HapticPattern = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Silently fail
  }
}
