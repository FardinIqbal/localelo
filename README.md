# LocalElo

Glicko-2 rating platform for competitive communities.

## Hero

Built for BJJ academies, esports teams, chess clubs, racket sport ladders, and any group that runs its own ranking. Each organization gets an isolated space, its own leaderboards, its own members, and its own rating history.

## What it is

A multi-tenant ranking system. Organizations create leaderboards. Members log matches. Ratings update via Glicko-2 on match completion. Admins approve members, invalidate matches, and run invite links. Rating history is charted per leaderboard, per member.

## Key features

- **Multi-org isolation.** Every organization has separate leaderboards, members, ratings, and history. A member can hold distinct ratings across orgs and across leaderboards within an org.
- **Glicko-2 ratings.** Tracks rating, rating deviation, and volatility. Starts at 1500 / 350 RD / 0.06 volatility. New players gain certainty as they play. Inactivity inflates RD.
- **Member approval workflow.** Public orgs auto-join. Private orgs queue pending members for admin approval. Status is `pending` / `approved` / `banned`. Roles are member / admin / owner.
- **Invite links.** Signed codes with optional `maxUses` and `expiresAt`. Join by slug or by invite code.
- **Match logging.** Members log their own results. Admins log matches between any two players. Ratings update atomically; before/after snapshots are stored on every `MatchParticipant`.
- **Match invalidation with rollback.** Soft-delete a match and every downstream rating mutation is reversed. `deletedAt` / `deletedBy` audit trail retained.
- **Analytics.** Rating history charts (Recharts), win-rate trends, recent-opponent surfaces, head-to-head stats between any two players on a leaderboard.
- **Gamification.** Daily streaks with freeze tokens and weekend amulets, weekly XP leagues across six tiers (bronze, silver, gold, platinum, diamond, champion), achievement badges, rating milestones, and challenge flows between members.

## Architecture

```
src/
  app/
    (auth)/              Clerk-hosted sign-in / sign-up
    (dashboard)/         Authenticated app shell
      dashboard/         User home, org list, org creation
      org/[slug]/        Org home + leaderboard detail
      rankings/          Cross-org rankings
    api/
      trpc/[trpc]/       tRPC HTTP handler
      webhooks/clerk/    Clerk -> users table sync
    join/[slug]/         Public org join
    invite/[code]/       Invite-code redemption
  components/ui/         Radix + shadcn primitives
  lib/                   tRPC client, utils, Glicko-2 math
  middleware.ts          Clerk route protection
server/api/
  trpc.ts                Context, procedures, auth guards
  root.ts                Root router
  routers/               organizations, leaderboards, matches, invites, ratings, activity, streaks, achievements, goals, memberships
db/
  schema.ts              Drizzle schema (users, orgs, memberships, invites, leaderboards, ratings, matches, matchParticipants, ratingHistory, streaks, XP, leagues, achievements, challenges)
```

### Data model (core entities)

- `users` - synced from Clerk by `clerkId`.
- `organizations` - `slug`, `visibility: public | private`, `createdBy`.
- `memberships` - `(organizationId, userId)` pair with per-org `username`, `status`, `isAdmin`, `isOwner`.
- `leaderboards` - ranking ladder scoped to an org.
- `ratings` - Glicko-2 triple `(rating, ratingDeviation, volatility)` plus win / loss / draw counters, scoped to `(leaderboardId, membershipId)`.
- `matches` - `winnerMembershipId` (nullable for draws), `status: active | invalidated`, `matchTime`, soft-delete fields.
- `matchParticipants` - before/after rating snapshots per player per match.
- `ratingHistory` - immutable rating points for charting.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle |
| API | tRPC (end-to-end type-safe) |
| Auth | Clerk (webhook-synced `users` table) |
| UI | Tailwind CSS 4, Radix primitives, shadcn/ui |
| Charts | Recharts |
| Validation | Zod |
| Tests | Vitest |
| Deploy | Vercel |

## Engineering notes

- **Rating math is isolated.** Glicko-2 lives in a single module, pure functions, no I/O. Rating updates happen inside the match-creation transaction so partial writes cannot corrupt the ladder.
- **Invalidation is a true rollback.** Invalidating a match reverses every participant's rating mutation using the stored `ratingBefore` snapshots and replays the history tail. No orphaned history rows.
- **Per-org usernames.** A user can be `fardin` in one gym and `fi` in another. Uniqueness is enforced on `(organizationId, username)`, not globally.
- **Webhook-driven user sync.** Clerk `user.created` / `user.updated` / `user.deleted` events write directly to `users`; the app never reads Clerk at request time.
- **Test suite.** 35 unit tests covering the invite system (code generation, expiry, max-use decrement, redemption edge cases). 36 integration tests covering tRPC routers (org create / join, membership approval, match logging, rating updates, invalidation rollback, head-to-head, leaderboard ranking). 71 total, all passing on Vitest.
- **Cron.** Vercel cron handles weekly league resets and daily streak reminders.

## Quick start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Clerk application

### Install

```bash
git clone https://github.com/FardinIqbal/localelo.git
cd localelo
npm install
cp .env.example .env.local
```

### Environment

```env
DATABASE_URL="postgresql://user:password@localhost:5432/localelo"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

Point the Clerk webhook at `https://<host>/api/webhooks/clerk` and subscribe to `user.created`, `user.updated`, `user.deleted`.

### Database

```bash
npm run db:push        # dev: push schema directly
npm run db:generate    # prod: generate migration
npm run db:migrate     # prod: run migrations
npm run db:studio      # inspect data
npm run db:seed        # seed demo org + members + matches
```

### Dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Testing

```bash
npm test               # watch mode
npm run test:run       # single run
npm run test:coverage  # coverage report
```

Coverage targets: the rating engine, invite lifecycle, and every tRPC router mutation. Fixtures build an in-memory org + leaderboard + members via a factory module (`test/factories`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run built server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest watch |
| `npm run test:run` | Vitest single run |
| `npm run db:push` | Push schema to DB |
| `npm run db:generate` | Generate SQL migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed demo data |

## License

MIT.
