"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  "#FFD700", // Gold
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96E6A1", // Green
  "#DDA0DD", // Purple
  "#FFB347", // Orange
];

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 50,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const startTimeRef = useRef<number>(0);

  const createPieces = useCallback(() => {
    const pieces: ConfettiPiece[] = [];
    const centerX = window.innerWidth / 2;

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: i,
        x: centerX + (Math.random() - 0.5) * 100,
        y: window.innerHeight * 0.3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 15,
        velocityY: -Math.random() * 15 - 5,
        rotationSpeed: (Math.random() - 0.5) * 20,
        opacity: 1,
      });
    }

    return pieces;
  }, [pieceCount, colors]);

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Initialize start time
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = elapsed / duration;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw pieces
      let hasVisiblePieces = false;

      for (const piece of piecesRef.current) {
        // Physics update
        piece.velocityY += 0.3; // Gravity
        piece.x += piece.velocityX;
        piece.y += piece.velocityY;
        piece.rotation += piece.rotationSpeed;

        // Fade out
        if (progress > 0.7) {
          piece.opacity = 1 - (progress - 0.7) / 0.3;
        }

        // Check if still visible
        if (piece.y < canvas.height + 20 && piece.opacity > 0) {
          hasVisiblePieces = true;

          // Draw piece
          ctx.save();
          ctx.translate(piece.x, piece.y);
          ctx.rotate((piece.rotation * Math.PI) / 180);
          ctx.globalAlpha = piece.opacity;
          ctx.fillStyle = piece.color;

          // Random shape (rectangle or circle)
          if (piece.id % 2 === 0) {
            ctx.fillRect(
              -piece.size / 2,
              -piece.size / 2,
              piece.size,
              piece.size * 0.6
            );
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      // Continue animation or complete
      if (hasVisiblePieces && progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    },
    [duration, onComplete]
  );

  useEffect(() => {
    if (isActive) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Create pieces and start animation
      piecesRef.current = createPieces();
      startTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isActive, createPieces, animate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[100]"
        />
      )}
    </AnimatePresence>
  );
}
