"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Flame,
  Trophy,
  Swords,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/hooks/use-haptics";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

interface NotificationSettingsProps {
  settings: {
    pushEnabled: boolean;
    streakReminders: boolean;
    rankChanges: boolean;
    challengeAlerts: boolean;
    weeklyResults: boolean;
    reminderTime?: string;
  };
  onSettingsChange: (settings: NotificationSettingsProps["settings"]) => void;
  onRequestPermission?: () => Promise<boolean>;
  isLoading?: boolean;
}

export function NotificationSettings({
  settings,
  onSettingsChange,
  onRequestPermission,
  isLoading = false,
}: NotificationSettingsProps) {
  const [permissionStatus, setPermissionStatus] = useState<
    "default" | "granted" | "denied"
  >(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "default"
  );

  const handleRequestPermission = async () => {
    triggerHaptic("medium");

    if (onRequestPermission) {
      const granted = await onRequestPermission();
      if (granted) {
        setPermissionStatus("granted");
        onSettingsChange({ ...settings, pushEnabled: true });
      } else {
        setPermissionStatus("denied");
      }
    } else if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === "granted") {
        onSettingsChange({ ...settings, pushEnabled: true });
      }
    }
  };

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    triggerHaptic("light");
    onSettingsChange({ ...settings, [key]: value });
  };

  const notificationOptions: NotificationSetting[] = [
    {
      id: "streakReminders",
      label: "Streak Reminders",
      description: "Daily reminder to maintain your activity streak",
      icon: Flame,
      enabled: settings.streakReminders,
    },
    {
      id: "rankChanges",
      label: "Rank Changes",
      description: "When someone passes you in the rankings",
      icon: TrendingUp,
      enabled: settings.rankChanges,
    },
    {
      id: "challengeAlerts",
      label: "Challenge Alerts",
      description: "New challenges and expiring challenges",
      icon: Swords,
      enabled: settings.challengeAlerts,
    },
    {
      id: "weeklyResults",
      label: "Weekly Results",
      description: "League standings and promotions/demotions",
      icon: Trophy,
      enabled: settings.weeklyResults,
    },
  ];

  const reminderTimes = [
    { value: "09:00", label: "9:00 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "18:00", label: "6:00 PM" },
    { value: "21:00", label: "9:00 PM" },
  ];

  return (
    <div className="space-y-6">
      {/* Push Permission */}
      {permissionStatus !== "granted" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl border p-4",
            permissionStatus === "denied"
              ? "border-rose-500/30 bg-rose-500/5"
              : "border-primary/30 bg-primary/5"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                permissionStatus === "denied"
                  ? "bg-rose-500/10"
                  : "bg-primary/10"
              )}
            >
              {permissionStatus === "denied" ? (
                <BellOff className="h-5 w-5 text-rose-400" />
              ) : (
                <Bell className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {permissionStatus === "denied"
                  ? "Notifications Blocked"
                  : "Enable Notifications"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {permissionStatus === "denied"
                  ? "You'll need to enable notifications in your browser settings."
                  : "Get alerts for challenges, rank changes, and streak reminders."}
              </p>
              {permissionStatus !== "denied" && (
                <Button
                  onClick={handleRequestPermission}
                  size="sm"
                  className="mt-3"
                  disabled={isLoading}
                >
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Master Toggle */}
      {permissionStatus === "granted" && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications on this device
              </p>
            </div>
          </div>
          <Switch
            checked={settings.pushEnabled}
            onCheckedChange={(checked) => handleToggle("pushEnabled", checked)}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Individual Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Notification Types
        </h4>
        {notificationOptions.map((option) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center justify-between rounded-xl border bg-card p-4 transition-opacity",
              !settings.pushEnabled && "opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <option.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              checked={option.enabled}
              onCheckedChange={(checked) =>
                handleToggle(
                  option.id as keyof typeof settings,
                  checked
                )
              }
              disabled={isLoading || !settings.pushEnabled}
            />
          </motion.div>
        ))}
      </div>

      {/* Reminder Time */}
      {settings.streakReminders && settings.pushEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <h4 className="text-sm font-medium text-muted-foreground">
            Daily Reminder Time
          </h4>
          <div className="flex items-center gap-2 rounded-xl border bg-card p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <select
              value={settings.reminderTime || "18:00"}
              onChange={(e) =>
                onSettingsChange({ ...settings, reminderTime: e.target.value })
              }
              className="flex-1 bg-transparent text-sm focus:outline-none"
              disabled={isLoading}
            >
              {reminderTimes.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}
