"use client";

import { useEffect, useState, createContext, useContext, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type?: "default" | "success" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"], action?: Toast["action"], duration?: number) => void;
  toastWithUndo: (message: string, type: Toast["type"], onUndo: () => void) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((
    message: string,
    type: Toast["type"] = "default",
    action?: Toast["action"],
    duration?: number
  ) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, action, duration }]);
  }, []);

  const toastWithUndo = useCallback((
    message: string,
    type: Toast["type"],
    onUndo: () => void
  ) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
        duration: 5000, // Longer duration for undo toasts
        action: {
          label: "Undo",
          onClick: () => {
            onUndo();
            setToasts((prev) => prev.filter((t) => t.id !== id));
          },
        },
      },
    ]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toastWithUndo }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const duration = toast.duration ?? 2000;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onRemove, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onRemove, duration]);

  const handleActionClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    toast.action?.onClick();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2 backdrop-blur-sm shadow-lg",
        toast.type === "success" && "border-emerald-500/30",
        toast.type === "error" && "border-rose-500/30"
      )}
    >
      <span className={cn(
        "text-sm font-medium",
        toast.type === "success" && "text-emerald-400",
        toast.type === "error" && "text-rose-400"
      )}>
        {toast.message}
      </span>
      {toast.action && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleActionClick}
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          <Undo2 className="h-3 w-3" />
          {toast.action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
