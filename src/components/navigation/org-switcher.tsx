"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  memberCount?: number;
  userRating?: number;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  currentOrgSlug?: string;
  className?: string;
}

export function OrgSwitcher({
  organizations,
  currentOrgSlug,
  className,
}: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const currentOrg = organizations.find((org) => org.slug === currentOrgSlug);

  // Sort by recent activity (would come from API in real implementation)
  const sortedOrgs = [...organizations].sort((a, b) => {
    // Current org first
    if (a.slug === currentOrgSlug) return -1;
    if (b.slug === currentOrgSlug) return 1;
    return 0;
  });

  const handleSelect = (org: Organization) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsOpen(false);
    router.push(`/org/${org.slug}`);
  };

  const handleCreateOrg = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsOpen(false);
    router.push("/create-org");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-secondary active:bg-secondary/80",
          className
        )}
      >
        {currentOrg ? (
          <>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {currentOrg.name.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[120px] truncate">{currentOrg.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select org</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="border-b border-border px-4 pb-3">
                <h2 className="text-lg font-semibold">Organizations</h2>
                <p className="text-sm text-muted-foreground">
                  {organizations.length} organization
                  {organizations.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Org List */}
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {sortedOrgs.map((org) => {
                  const isSelected = org.slug === currentOrgSlug;

                  return (
                    <motion.button
                      key={org.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(org)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                        isSelected
                          ? "bg-primary/10"
                          : "hover:bg-secondary active:bg-secondary/80"
                      )}
                    >
                      {/* Org Avatar */}
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        )}
                      >
                        {org.imageUrl ? (
                          <img
                            src={org.imageUrl}
                            alt={org.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          org.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Org Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {org.name}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{org.memberCount ?? 0} members</span>
                          {org.userRating && (
                            <>
                              <span className="text-muted-foreground/50">

                              </span>
                              <span className="font-medium text-foreground">
                                {Math.round(org.userRating)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Create Org Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateOrg}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary active:bg-secondary/80"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Create organization
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
