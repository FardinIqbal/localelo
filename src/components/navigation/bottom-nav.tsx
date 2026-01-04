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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
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
                className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-full"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <Icon className="h-6 w-6" />
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
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-[1px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
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
