"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Plus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
    matchPaths: ["/dashboard"],
  },
  {
    label: "Log",
    href: "#play",
    icon: Plus,
  },
  {
    label: "Rankings",
    href: "/rankings",
    icon: Trophy,
    matchPaths: ["/rankings", "/org"],
  },
];

interface BottomNavProps {
  onPlayClick?: () => void;
}

export function BottomNav({ onPlayClick }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.href === "#play") return false;
    if (item.matchPaths) {
      return item.matchPaths.some((path) => pathname.startsWith(path));
    }
    return pathname === item.href;
  };

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (item.href === "#play") {
      e.preventDefault();
      onPlayClick?.();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const isPlayButton = item.href === "#play";

          if (isPlayButton) {
            return (
              <button
                key={item.label}
                onClick={(e) => handleClick(item, e)}
                className="relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center rounded-full"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40"
                >
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-md" />
                  <Icon className="relative h-7 w-7" />
                </motion.div>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleClick(item, e)}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors",
                active
                  ? "text-orange-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-[1px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
