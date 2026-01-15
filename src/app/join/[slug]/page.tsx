"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function JoinOrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrCode = params.slug as string;
  const { isSignedIn, isLoaded, user } = useUser();

  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Try to validate as invite code first
  const inviteValidation = useQuery(
    api.invites.validate,
    slugOrCode ? { code: slugOrCode } : "skip"
  );

  // If not a valid invite code, try as slug
  const isInviteCode = inviteValidation?.valid === true;
  const org = useQuery(
    api.organizations.getBySlug,
    !isInviteCode && slugOrCode ? { slug: slugOrCode } : "skip"
  );

  // Get the organization info from either source
  const orgInfo = isInviteCode
    ? inviteValidation?.organization
    : org
      ? { id: org._id, name: org.name, slug: org.slug }
      : null;

  const orgLoading = inviteValidation === undefined || (!isInviteCode && org === undefined);

  const joinByInvite = useMutation(api.invites.accept);
  const joinBySlug = useMutation(api.memberships.joinBySlug);

  // Auto-join when user is signed in
  const handleJoin = async () => {
    if (isPending || !orgInfo) return;

    // Get the user's name from Clerk
    const displayName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName.charAt(0)}` : ""}`
      : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Anonymous";

    setError("");
    setIsPending(true);

    try {
      if (isInviteCode) {
        await joinByInvite({ code: slugOrCode, username: displayName });
      } else {
        await joinBySlug({ slug: slugOrCode, username: displayName });
      }
      router.push(`/org/${orgInfo.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to join");
      setIsPending(false);
    }
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

  // Org not found (neither valid invite code nor valid slug)
  if (!orgInfo) {
    const errorMessage = inviteValidation?.error || "This invite link may be invalid or expired.";
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
              {errorMessage}
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
              Join {orgInfo.name}
            </h1>
            <p className="mt-3 text-[15px] text-zinc-500">
              Create an account to join this organization and start competing.
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href={`/sign-up?redirect_url=/join/${slugOrCode}`}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-medium text-black transition-colors hover:bg-zinc-200"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`/sign-in?redirect_url=/join/${slugOrCode}`}
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

  // Signed in - one-click join
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
          className="w-full max-w-sm text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
            <Users className="h-8 w-8 text-zinc-500" />
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Join {orgInfo.name}
          </h1>
          <p className="mt-3 text-[15px] text-zinc-500">
            You&apos;ll appear as <span className="text-white font-medium">{user?.firstName || "Anonymous"}</span> on leaderboards
          </p>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-[13px] text-red-400"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            onClick={handleJoin}
            disabled={isPending}
            className="mt-8 group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-medium text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            whileTap={{ scale: 0.98 }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                Join organization
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
