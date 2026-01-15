"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, SignIn, SignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Loader2, AlertCircle, Check, ArrowRight } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { isSignedIn, isLoaded } = useAuth();

  const [username, setUsername] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Validate invite - Convex query
  const invite = useQuery(api.invites.validate, code ? { code } : "skip");
  const isLoading = invite === undefined;
  const error = invite && !invite.valid ? invite.error : null;

  // Accept invite mutation
  const acceptInviteMutation = useMutation(api.invites.accept);

  const handleJoin = async () => {
    if (!username.trim() || isJoining) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const result = await acceptInviteMutation({ code, username: username.trim() });
      // Result can be a membershipId (already member) or { membershipId, organization }
      if (typeof result === "object" && "organization" in result && result.organization) {
        router.push(`/org/${result.organization.slug}`);
      } else {
        // Already a member, just redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setJoinError(err.message || "Failed to join");
      setIsJoining(false);
    }
  };

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Validating invite...
          </p>
        </motion.div>
      </div>
    );
  }

  // Invalid invite
  if (!invite?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            Invalid Invite
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {invite?.error || "This invite link is invalid or has expired."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Valid invite - show org info
  const org = invite.organization!;

  // Not signed in - show auth
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-sm px-4 py-12">
          {/* Org Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Join {org.name}
            </h1>
          </motion.div>

          {/* Auth Toggle */}
          <div className="mb-6 flex rounded-full bg-secondary p-1">
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                authMode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setAuthMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                authMode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Clerk Auth */}
          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, x: authMode === "signup" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: authMode === "signup" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {authMode === "signup" ? (
                <SignUp
                  routing="hash"
                  forceRedirectUrl={`/invite/${code}`}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-border hover:bg-secondary",
                      formFieldInput: "border-border bg-background",
                      footerActionLink: "text-primary hover:text-primary/80",
                    },
                  }}
                />
              ) : (
                <SignIn
                  routing="hash"
                  forceRedirectUrl={`/invite/${code}`}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-border hover:bg-secondary",
                      formFieldInput: "border-border bg-background",
                      footerActionLink: "text-primary hover:text-primary/80",
                    },
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Signed in - show username form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Org Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {org.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Join {org.name}
          </h1>
        </div>

        {/* Username Form */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Choose your display name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="e.g. John, JohnD, johnny123"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <p className="mt-2 text-xs text-muted-foreground">
              This is how others will see you on leaderboards
            </p>
          </div>

          {joinError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {joinError}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={!username.trim() || isJoining}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join {org.name}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
