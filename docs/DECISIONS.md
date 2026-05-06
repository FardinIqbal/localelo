# Architectural Decision Records

Each entry documents a non-obvious engineering choice, its alternatives, and why I picked what I picked.

---

## ADR 1: Store before/after snapshots on every matchParticipant

**Status:** accepted (the central decision)

**Context:**
Match invalidation is a hard problem. When an admin invalidates a match (cheating, mistake, dispute), the leaderboard must reflect the corrected reality, including any subsequent matches that built on the now-invalidated state.

Three options:

1. **Soft-delete only**: mark the match invalid; do not recompute downstream ratings. The leaderboard becomes inconsistent.
2. **Full recompute**: when a match is invalidated, replay all subsequent matches from scratch using the original schedule. Expensive but correct.
3. **Snapshot-based replay** (this design): store each player's rating triple before AND after every match in a `matchParticipants` row. Invalidation replays only the affected cascade using the stored before-snapshots.

**Decision:**
Snapshot-based replay.

**Consequences:**

- Pro: O(N) replay where N is the number of subsequent matches involving affected users, not O(M) where M is total matches.
- Pro: leaderboard stays consistent after any invalidation.
- Pro: history preserved. The original matches still exist with their original calculated ratings; invalidation produces a new state without rewriting history.
- Pro: auditable. Every rating change traces back to a specific match.
- Con: extra storage per match. Each `matchParticipants` row carries 6 floats (before/after rating + RD + volatility) plus user and match IDs.
- Con: extra logic in match creation (must capture before-snapshot before the rating update).

This is the design choice that distinguishes LocalElo from a basic Elo tracker. Rating systems that cannot undo are systems that punish users for the system's mistakes.

---

## ADR 2: Glicko-2 over basic Elo

**Status:** accepted

**Context:**
Rating systems for competitive games. Three options:

1. **Basic Elo**: simple, well-known, but no concept of rating uncertainty.
2. **Glicko**: adds rating deviation (RD) representing confidence in the rating.
3. **Glicko-2** (this design): adds rating volatility on top of Glicko, capturing how erratic the player's recent results have been.

**Decision:**
Glicko-2.

**Consequences:**

- Pro: more accurate. Players with sparse match histories get appropriately wider confidence intervals.
- Pro: handles inactivity. RD inflates when a player does not play, reflecting that we are less certain about their current strength.
- Pro: well-documented. The original [Glicko-2 paper by Mark Glickman](http://www.glicko.net/glicko/glicko2.pdf) is precise.
- Con: more complex math. Volatility update requires Illinois bisection for the root-finding step.
- Con: rating changes are slower at first (until RD shrinks), which can confuse users used to immediate Elo swings.

For a rating system meant to handle real competitive communities with varied activity patterns, Glicko-2 is the right call. Basic Elo is a teaching example.

---

## ADR 3: Webhook-driven Clerk sync over per-request lookup

**Status:** accepted

**Context:**
The application needs to know who the authenticated user is and what they are allowed to do. Two options:

1. **Per-request Clerk lookup**: every authenticated route calls Clerk's API to fetch user info.
2. **Webhook-driven sync** (this design): Clerk fires a webhook on user create/update/delete; the app writes user info to the local `users` table; subsequent requests read from local DB.

**Decision:**
Webhooks.

**Consequences:**

- Pro: faster. Local DB lookup is microseconds; Clerk API call is tens of milliseconds plus network jitter.
- Pro: scales better. No external API rate limit on the hot path.
- Pro: allows enriching user records with app-specific data (per-org username, role, status).
- Con: webhooks can fail or arrive late. The user might exist in Clerk but not yet in the local DB.
- Con: extra plumbing (webhook handler, signature verification, idempotency).

The latency win is significant. For a SaaS with 1000+ requests per second, the per-request approach would saturate Clerk's rate limit.

---

## ADR 4: tRPC for end-to-end type safety

**Status:** accepted

**Context:**
API layer between the React frontend and the Next.js backend. Three options:

1. **REST + manual TypeScript types**: define types in shared modules, hope client and server stay in sync.
2. **GraphQL with codegen**: types are generated from the schema; changes flow automatically.
3. **tRPC** (this design): server defines procedures; client imports them as if they were local functions.

**Decision:**
tRPC.

**Consequences:**

- Pro: zero schema duplication. The procedure definition is the schema.
- Pro: full TypeScript propagation. Renaming a field on the server surfaces as a type error in every component that consumes it.
- Pro: lighter than GraphQL. No separate schema language, no codegen step.
- Pro: works seamlessly with Next.js App Router.
- Con: tRPC is TypeScript-only. Cannot expose the API to non-TS clients (mobile native, third-party integrations).
- Con: tied to a specific TypeScript ecosystem. Not as universal as REST or GraphQL.

For a Next.js + TypeScript app where the only consumer is the same app's frontend, tRPC is the optimal choice. If we ever needed to expose a public API, we would add a REST layer alongside.

---

## ADR 5: Drizzle ORM over Prisma

**Status:** accepted

**Context:**
ORM choice for TypeScript + Postgres. Two options:

1. **Prisma**: feature-rich, generates a client from the schema, popular default.
2. **Drizzle** (this design): lighter, SQL-first, type-safe queries that look like SQL.

**Decision:**
Drizzle.

**Consequences:**

- Pro: smaller bundle. Drizzle compiles to direct SQL; Prisma ships a runtime engine.
- Pro: SQL-first syntax. Queries look like SQL (`db.select().from(users).where(eq(users.id, 1))`), so the underlying SQL is obvious.
- Pro: better edge support. Drizzle works on Cloudflare Workers and Vercel Edge; Prisma needs a separate edge driver.
- Con: smaller community. Prisma has more StackOverflow answers, more tutorials.
- Con: migrations are slightly less polished than Prisma's.

For a Next.js app deployed to Vercel Edge, Drizzle is the right call. Bundle size matters at the edge.

---

## ADR 6: Convex backend (alongside or instead of Postgres)

**Status:** under consideration

**Context:**
The project uses both Drizzle/Postgres and Convex. The dual-backend story is unusual and likely transitional.

**Decision (provisional):**
Use Convex for real-time features (live leaderboards, match notifications), Postgres for relational queries (analytics, history).

**Consequences:**

- Pro: Convex's real-time queries push updates to clients automatically.
- Pro: Postgres handles complex relational queries that Convex's document model would make awkward.
- Con: two stores to keep in sync, double the operational complexity.
- Con: developer cognitive load (which store does this data live in?).

This is the kind of decision that needs to be revisited as the product matures. Future direction: consolidate to one backend (likely Convex if real-time wins, Postgres if relational complexity wins).

---

## ADR 7: Public-by-default invite codes

**Status:** accepted

**Context:**
Users join organizations via invite codes. Two options:

1. **Single-use codes**: each code is valid for one user only.
2. **Reusable codes with expiry** (this design): codes have a max-uses count and an expiry date.

**Decision:**
Reusable.

**Consequences:**

- Pro: matches the real workflow. A gym admin generates one invite code and shares it in a Slack channel.
- Pro: users do not need to request individual invites.
- Pro: expiry caps the lifetime of leaked codes.
- Con: one leaked code lets multiple unauthorized users in (until expiry).
- Con: cannot trace a specific user's signup back to a specific invite (multiple users share one code).

Single-use would be more secure but worse UX. The expiry plus max-uses is the pragmatic balance.
