"use client";

import { useEffect } from "react";
import { ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth, useUser } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/simple-toast";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

function UserSync() {
  const { isSignedIn, user } = useUser();
  const syncUser = useMutation(api.users.sync);

  useEffect(() => {
    if (isSignedIn && user) {
      syncUser().catch(() => {
        // Ignore errors - user might already exist
      });
    }
  }, [isSignedIn, user, syncUser]);

  return null;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSync />
      <ToastProvider>{children}</ToastProvider>
    </ConvexProviderWithClerk>
  );
}

// Keep old name for backwards compatibility during migration
export const TRPCProvider = ConvexClientProvider;
