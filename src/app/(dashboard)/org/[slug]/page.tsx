"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, ChevronRight, X, Link2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

function CreateLeaderboardModal({
  isOpen,
  onClose,
  organizationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}) {
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const createLeaderboard = trpc.leaderboards.create.useMutation({
    onSuccess: () => {
      utils.leaderboards.byOrganization.invalidate({ organizationId });
      onClose();
      setName("");
    },
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm mx-4 p-6 rounded-xl border border-zinc-800 bg-zinc-950"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="text-[17px] font-semibold mb-6">New leaderboard</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createLeaderboard.mutate({ organizationId, name: name.trim() });
            }}
          >
            <input
              type="text"
              placeholder="Leaderboard name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-0 border-b border-zinc-800 bg-transparent py-3 text-[15px] outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
              autoFocus
            />

            <motion.button
              type="submit"
              disabled={!name.trim() || createLeaderboard.isPending}
              className="mt-6 w-full rounded-full bg-white py-2.5 text-[13px] font-medium text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              whileTap={{ scale: 0.98 }}
            >
              {createLeaderboard.isPending ? "Creating..." : "Create"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LeaderboardRow({
  leaderboard,
  orgSlug,
  index,
}: {
  leaderboard: { id: string; name: string };
  orgSlug: string;
  index: number;
}) {
  const { data: rankings } = trpc.leaderboards.rankings.useQuery({
    leaderboardId: leaderboard.id,
  });

  const count = rankings?.length ?? 0;

  return (
    <Link href={`/org/${orgSlug}/leaderboard/${leaderboard.id}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 }}
        className="group flex items-center justify-between px-4 py-4 transition-colors hover:bg-zinc-900/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/80 text-[11px] font-medium text-zinc-500">
            {leaderboard.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="text-[14px] font-medium">{leaderboard.name}</span>
            <p className="text-[12px] text-zinc-600">
              {count} {count === 1 ? "competitor" : "competitors"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-zinc-700 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
      </motion.div>
    </Link>
  );
}

function InviteLinkButton({ orgSlug }: { orgSlug: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const link = `${window.location.origin}/join/${orgSlug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={copyLink}
      className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
      whileTap={{ scale: 0.95 }}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-500">Copied</span>
        </>
      ) : (
        <>
          <Link2 className="h-3 w-3" />
          Invite link
        </>
      )}
    </motion.button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-900" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <p className="mb-6 text-[14px] text-zinc-600">
        Create a leaderboard to start tracking rankings
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
      >
        <Plus className="h-3.5 w-3.5" />
        New leaderboard
      </button>
    </motion.div>
  );
}

export default function OrganizationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [modalOpen, setModalOpen] = useState(false);

  const { data: org, isLoading: orgLoading } = trpc.organizations.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { data: leaderboards, isLoading: leaderboardsLoading } =
    trpc.leaderboards.byOrganization.useQuery(
      { organizationId: org?.id ?? "" },
      { enabled: !!org?.id }
    );

  const { data: members } = trpc.organizations.members.useQuery(
    { organizationId: org?.id ?? "" },
    { enabled: !!org?.id }
  );

  if (orgLoading) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="mb-8">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="rounded-xl border border-zinc-800/50">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-[17px] font-medium">Organization not found</h2>
        <p className="mt-2 text-[13px] text-zinc-600">
          It might have been removed or you don&apos;t have access.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      <CreateLeaderboardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        organizationId={org.id}
      />

      {/* Back */}
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-zinc-600 transition-colors hover:text-zinc-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">{org.name}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[13px] text-zinc-600">
                {members?.length ?? 0} members
              </span>
              <InviteLinkButton orgSlug={org.slug} />
            </div>
          </div>
          {leaderboards && leaderboards.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          )}
        </div>
      </motion.div>

      {/* Leaderboards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-zinc-800/50"
      >
        {leaderboardsLoading ? (
          <LoadingSkeleton />
        ) : !leaderboards || leaderboards.length === 0 ? (
          <EmptyState onCreateClick={() => setModalOpen(true)} />
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {leaderboards.map((lb, i) => (
              <LeaderboardRow
                key={lb.id}
                leaderboard={lb}
                orgSlug={org.slug}
                index={i}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
