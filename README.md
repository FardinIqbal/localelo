# LocalElo

A multi-organization Elo ranking platform for competitive communities. Built for BJJ academies, esports teams, chess clubs, racket sports, and any group that wants fair, transparent rankings.

## The Problem

Competitive communities lack good tooling for rankings:
- Spreadsheets don't scale and require manual Elo calculations
- Generic leaderboard apps don't understand multi-organization structures
- Most solutions are either too simple (basic win/loss) or too complex (enterprise software)

## The Solution

LocalElo provides:
- **Multi-organization support** - Each gym/club/team has their own space with separate leaderboards
- **Glicko-2 rating system** - More accurate than basic Elo, accounts for rating uncertainty
- **Member management** - Public/private orgs, approval workflows, role-based access
- **Match logging** - Simple interface to record results with automatic rating updates
- **Analytics** - Rating history charts, win rates, activity trends

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| API | tRPC (end-to-end type safety) |
| Auth | Clerk |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Deployment | Vercel |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── trpc/[trpc]/   # tRPC endpoint
│   │   └── webhooks/      # Clerk webhook for user sync
│   └── (routes)/          # Page routes
├── components/            # React components
├── db/
│   ├── schema.ts          # Drizzle schema definitions
│   └── index.ts           # Database connection
├── lib/
│   ├── elo.ts             # Glicko-2 implementation
│   ├── trpc.ts            # tRPC client
│   └── utils.ts           # Utilities
├── server/api/
│   ├── trpc.ts            # tRPC context & procedures
│   ├── root.ts            # Root router
│   └── routers/           # Domain-specific routers
│       ├── organizations.ts
│       ├── leaderboards.ts
│       └── matches.ts
└── types/                 # TypeScript types
```

## Data Model

### Core Entities

**User** - Synced with Clerk on sign-up. Stores basic profile info.

**Organization** - A gym, club, or team. Can be public (auto-join) or private (approval required).

**OrganizationMembership** - Links users to organizations. Each user has a unique username per org. Tracks status (pending/approved/banned) and roles (member/admin/owner).

**Leaderboard** - A ranking ladder within an organization. Examples: "No-Gi Advanced", "Blitz Chess", "1v1 Valorant".

**LeaderboardRating** - A member's rating on a specific leaderboard. Stores Glicko-2 values (rating, rating deviation, volatility) plus win/loss/draw counts.

**Match** - A recorded contest between two members. Triggers automatic Elo updates.

**MatchParticipant** - Links members to matches with before/after rating snapshots.

**RatingHistory** - Historical rating snapshots for charting trends.

### Key Relationships

```
User
  └── has many OrganizationMemberships
       └── belongs to Organization
       └── has many LeaderboardRatings
            └── belongs to Leaderboard
       └── participates in Matches via MatchParticipants
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Clerk account (for auth)

### Installation

```bash
# Clone the repo
git clone https://github.com/FardinIqbal/localelo.git
cd localelo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/localelo"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

### Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your API keys to `.env.local`
3. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret to `CLERK_WEBHOOK_SECRET`

### Database Setup

```bash
# Push schema to database (development)
npm run db:push

# Or generate and run migrations (production)
npm run db:generate
npm run db:migrate

# Open Drizzle Studio to view data
npm run db:studio
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Reference

All API endpoints are type-safe via tRPC. Import the client:

```typescript
import { trpc } from "@/lib/trpc";
```

### Organizations

```typescript
// List public organizations
trpc.organizations.list.useQuery();

// Get by slug
trpc.organizations.getBySlug.useQuery({ slug: "my-gym" });

// Create organization (requires auth)
trpc.organizations.create.useMutation();

// Join organization (requires auth)
trpc.organizations.join.useMutation();

// Get user's organizations (requires auth)
trpc.organizations.myOrganizations.useQuery();
```

### Leaderboards

```typescript
// Get leaderboards for an org
trpc.leaderboards.byOrganization.useQuery({ organizationId: "..." });

// Get rankings
trpc.leaderboards.rankings.useQuery({ leaderboardId: "..." });

// Create leaderboard (requires admin)
trpc.leaderboards.create.useMutation();
```

### Matches

```typescript
// Get matches for a leaderboard
trpc.matches.byLeaderboard.useQuery({ leaderboardId: "...", limit: 20 });

// Log your own match (requires auth + membership)
trpc.matches.create.useMutation();
// Input: { leaderboardId, opponentMembershipId, outcome: "win" | "loss" | "draw" }

// Admin: Log match between any two players
trpc.matches.adminCreate.useMutation();
// Input: { leaderboardId, player1MembershipId, player2MembershipId, winnerId: string | null }

// Head-to-head stats between two players
trpc.matches.headToHead.useQuery({
  leaderboardId: "...",
  player1MembershipId: "...",
  player2MembershipId: "..."
});
```

## Rating System

LocalElo uses the **Glicko-2** rating system, which improves on traditional Elo by:

1. **Rating Deviation (RD)** - Measures rating certainty. New players have high RD (less certain). RD decreases as you play more.

2. **Volatility** - Measures how consistent your performance is. High volatility = unpredictable results.

3. **Rating Decay** - If you don't play, your RD increases (your rating becomes less certain).

### Default Values

- Starting Rating: 1500
- Starting RD: 350
- Starting Volatility: 0.06

### How Matches Affect Ratings

- **Win against higher-rated player** = Big rating gain, opponent's RD increases slightly
- **Win against lower-rated player** = Small rating gain
- **Loss against higher-rated player** = Small rating loss
- **Draw** = Rating moves toward opponent's rating

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard.

### Database

Use any PostgreSQL provider:
- [Neon](https://neon.tech) (recommended, serverless)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [PlanetScale](https://planetscale.com) (MySQL, requires schema changes)

## Roadmap

- [x] Dashboard with rating charts
- [x] Head-to-head statistics
- [x] Admin match logging
- [ ] Match confirmation flow (opponent must confirm result)
- [ ] Team matches (2v2, etc.)
- [ ] Tournament brackets
- [ ] Push notifications for match challenges
- [ ] Mobile app (React Native)
- [ ] API access for integrations

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
