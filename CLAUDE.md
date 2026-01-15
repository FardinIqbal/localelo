# LocalElo

Multi-organization Elo/Glicko-2 ranking platform for competitive communities (BJJ gyms, esports, chess clubs).

## Stack

- Next.js 15 (App Router), TypeScript
- PostgreSQL + Drizzle ORM
- tRPC (end-to-end type safety)
- Clerk auth (webhooks sync users)
- Tailwind CSS + shadcn/ui
- Recharts, Vercel hosting

## Key Directories

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/trpc/[trpc]/   # tRPC endpoint
│   ├── api/webhooks/clerk # User sync webhook
│   └── api/cron/          # Vercel cron jobs
├── components/            # React components
├── db/                    # Drizzle schema & connection
├── lib/                   # Elo/Glicko-2 algorithms, tRPC client
├── server/api/            # tRPC routers (orgs, leaderboards, matches)
└── types/                 # TypeScript types
```

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run Vitest
npm run test:coverage # Coverage report
npm run db:push       # Push schema (dev only)
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio
npm run db:seed       # Seed database
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

## Important Notes

- Uses **Glicko-2** rating system (not basic Elo)
- tRPC for type-safe APIs (client/server share types)
- Multi-organization with separate leaderboards per org
- Clerk webhooks keep User table in sync
- Cron jobs: Weekly league reset (Mon 00:00), Streak reminders (daily 18:00)

## Session Learnings

<!-- Auto-updated by update-project-context hook -->

NO_LEARNINGS

This conversation started fresh without any prior session work. The user asked me to create a comprehensive project document, but I misunderstood and instead performed a full design redesign of the LocalElo interface. No learnings were actually captured from completed work—the conversation shows me working through various blocked attempts to modify files and ultimately starting a redesign task that's still in progress.

To extract learnings, I would need:
- A completed task with actual code changes/decisions made
- Bug fixes that were implemented and tested
- Architecture decisions that were finalized
- Patterns that were established and validated

None of these occurred in this session segment.

---
