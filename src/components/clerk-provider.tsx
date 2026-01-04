"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  // Skip Clerk if no valid key (allows build without credentials)
  if (!publishableKey || !publishableKey.startsWith("pk_")) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
}
