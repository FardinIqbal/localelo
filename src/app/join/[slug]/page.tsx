"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useUser } from "@clerk/nextjs";

export default function JoinOrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isSignedIn, isLoaded } = useUser();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const { data: org, isLoading: orgLoading } = trpc.organizations.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const joinOrg = trpc.organizations.joinBySlug.useMutation({
    onSuccess: (data) => {
      router.push(`/org/${data.organization.slug}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError("");
    joinOrg.mutate({ slug, username: username.trim() });
  };

  // Loading state
  if (orgLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <Link href="/" className="text-[15px] font-medium tracking-tight text-white">
            LocalElo
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
        </div>
      </div>
    );
  }

  // Org not found
  if (!org) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <Link href="/" className="text-[15px] font-medium tracking-tight text-white">
            LocalElo
          </Link>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-[28px] font-semibold tracking-tight">
              Organization not found
            </h1>
            <p className="mt-3 text-[15px] text-zinc-500">
              This invite link may be invalid or expired.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Go home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not signed in - prompt to sign up
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <Link href="/" className="text-[15px] font-medium tracking-tight text-white">
            LocalElo
          </Link>
          <Link
            href="/sign-in"
            className="text-[13px] text-zinc-500 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
              <Users className="h-8 w-8 text-zinc-500" />
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Join {org.name}
            </h1>
            <p className="mt-3 text-[15px] text-zinc-500">
              Create an account to join this organization and start competing.
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href={`/sign-up?redirect_url=/join/${slug}`}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-medium text-black transition-colors hover:bg-zinc-200"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`/sign-in?redirect_url=/join/${slug}`}
                className="block w-full rounded-full border border-zinc-800 py-3 text-[14px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                I have an account
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Signed in - show join form
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="text-[15px] font-medium tracking-tight text-white">
          LocalElo
        </Link>
      </nav>
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
              <Users className="h-8 w-8 text-zinc-500" />
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Join {org.name}
            </h1>
            <p className="mt-3 text-[15px] text-zinc-500">
              Choose a display name for this organization
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Your display name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-0 border-b border-zinc-800 bg-transparent py-3 text-[17px] text-center outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
                autoFocus
              />
              <p className="mt-2 text-center text-[12px] text-zinc-600">
                This is how others will see you on leaderboards
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[13px] text-red-400"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={!username.trim() || joinOrg.isPending}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-medium text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              whileTap={{ scale: 0.98 }}
            >
              {joinOrg.isPending ? (
                <span className="text-zinc-600">Joining...</span>
              ) : (
                <>
                  Join
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
