"use client";

import { UserButton as ClerkUserButton } from "@clerk/nextjs";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function UserButton() {
  // Skip Clerk components if no valid key
  if (!publishableKey || !publishableKey.startsWith("pk_")) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium">
        U
      </div>
    );
  }

  return (
    <ClerkUserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "h-8 w-8",
        },
      }}
    />
  );
}
