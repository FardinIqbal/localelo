"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/simple-toast";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ToastProvider>{children}</ToastProvider>
    </ConvexProviderWithClerk>
  );
}

// Keep old name for backwards compatibility during migration
export const TRPCProvider = ConvexClientProvider;
