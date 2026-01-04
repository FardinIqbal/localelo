import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createTRPCContext = async () => {
  const session = await auth();

  return {
    db,
    userId: session.userId,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Get user from database by Clerk ID
  let [user] = await ctx.db
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.userId))
    .limit(1);

  // If no user found, try to get from Clerk and create/update
  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();

    if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
      const email = clerkUser.emailAddresses[0].emailAddress;

      // Check if user exists by email (might have been seeded with different clerk_id)
      const [existingByEmail] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingByEmail) {
        // Update clerk_id to match
        [user] = await ctx.db
          .update(users)
          .set({ clerkId: ctx.userId })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        console.log(`Synced clerk_id for ${email}`);
      } else {
        // Create new user
        [user] = await ctx.db
          .insert(users)
          .values({
            clerkId: ctx.userId,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
          })
          .returning();
        console.log(`Created user for ${email}`);
      }
    }
  }

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in database",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
