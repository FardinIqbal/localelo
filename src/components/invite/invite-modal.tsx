"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Copy, Check, Share2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface InviteModalProps {
  organizationId: string;
  orgName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ organizationId, orgName, isOpen, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createInvite = trpc.invites.create.useMutation();

  // Reset QR state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQrLoaded(false);
      setQrError(false);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Timeout after 8 seconds - show fallback if QR doesn't load
      timeoutRef.current = setTimeout(() => {
        setQrError(true);
      }, 8000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // Clear timeout when QR loads successfully
  useEffect(() => {
    if (qrLoaded && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [qrLoaded]);

  const inviteUrl = createInvite.data
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${createInvite.data.code}`
    : null;

  // Create invite when modal opens
  const handleOpen = () => {
    if (!createInvite.data && !createInvite.isPending) {
      createInvite.mutate({ organizationId });
    }
  };

  // Trigger on open
  if (isOpen && !inviteUrl && !createInvite.isPending && !createInvite.data) {
    handleOpen();
  }

  const copyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${orgName}`,
          text: `Join me on ${orgName}!`,
          url: inviteUrl,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const qrCodeUrl = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inviteUrl)}&bgcolor=000000&color=ffffff&margin=0`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-6 pb-8">
              {createInvite.isPending ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : qrCodeUrl ? (
                <>
                  {/* QR Code */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl bg-white p-4 relative"
                    >
                      {!qrLoaded && !qrError && (
                        <div className="h-[180px] w-[180px] flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      )}
                      {qrError ? (
                        <div className="h-[180px] w-[180px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                          <QrCode className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-[12px] text-gray-500 text-center px-4">
                            Share the link below
                          </p>
                        </div>
                      ) : (
                        <img
                          src={qrCodeUrl!}
                          alt="Scan to join"
                          className={`h-[180px] w-[180px] ${qrLoaded ? '' : 'hidden'}`}
                          onLoad={() => setQrLoaded(true)}
                          onError={() => setQrError(true)}
                        />
                      )}
                    </motion.div>
                  </div>

                  <p className="text-center text-[15px] font-medium text-foreground mb-1">
                    Scan to join {orgName}
                  </p>
                  <p className="text-center text-[13px] text-muted-foreground mb-6">
                    Or share the link below
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={shareLink}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Share2 className="h-5 w-5" />
                      Share Invite
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={copyLink}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                      {copied ? (
                        <>
                          <Check className="h-5 w-5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5" />
                          Copy Link
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Small button to trigger invite
export function InviteButton({
  organizationId,
  orgName,
  className,
}: {
  organizationId: string;
  orgName: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (navigator.vibrate) navigator.vibrate(10);
          setIsOpen(true);
        }}
        whileTap={{ scale: 0.9 }}
        className={className || "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"}
      >
        <QrCode className="h-4 w-4" />
      </motion.button>
      <InviteModal
        organizationId={organizationId}
        orgName={orgName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
