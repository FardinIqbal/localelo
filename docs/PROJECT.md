# LocalElo - Project Documentation

Multi-organization Elo/Glicko-2 ranking platform for competitive communities (BJJ gyms, esports teams, chess clubs, etc.).

---

## What This App Does

LocalElo lets competitive communities track matches, maintain dynamic leaderboards with professional rating systems, and keep players engaged through gamification (streaks, weekly leagues, challenges, achievements).

### Core Value Proposition
- **For gym owners/organizers**: Easy way to track member rankings and encourage engagement
- **For competitors**: See where you stand, track progress, compete in weekly leagues
- **For communities**: Build culture around friendly competition with meaningful stats

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, tRPC (end-to-end type safety)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk (webhook sync to local users table)
- **Charts**: Recharts
- **Hosting**: Vercel (with cron jobs)

---

## Core Features

### 1. Organizations

Users can create or join organizations (gyms, clubs, teams).

**Organization Types:**
- **Public**: Anyone can join, auto-approved
- **Private**: Membership requires admin approval

**Joining Methods:**
- Direct join via organization slug (public orgs)
- Invite link with 8-character code (auto-approved)
- Request to join (private orgs, pending approval)

**Roles:**
- **Owner**: Full control (set at creation)
- **Admin**: Manage leaderboards, approve members, create invites, log matches for others
- **Member**: Log own matches, view leaderboards

### 2. Leaderboards

Each organization can have multiple leaderboards (e.g., "Main Ladder", "No-Gi Advanced", "Rapid Chess").

**Features:**
- Separate ratings per leaderboard
- Rankings ordered by rating (highest first)
- Shows wins/losses/draws, win streak, 7-day rating change
- Members auto-added to all org leaderboards when joining

### 3. Rating System (Glicko-2)

Professional probabilistic rating system designed by Mark Glickman.

**Key Metrics:**
- **Rating**: Player strength (starts at 1500)
- **Rating Deviation (RD)**: Confidence in rating (starts at 350, decreases with more matches)
- **Volatility**: Consistency of performance (starts at 0.06)

**How It Works:**
- Win vs equal opponent: ~16 rating points
- Win vs higher-rated (upset): More points
- Win vs lower-rated: Fewer points
- RD decreases with activity (more certain rating)

**Why Glicko-2 Over Basic Elo:**
- Accounts for rating uncertainty
- More accurate for casual communities with irregular play schedules
- Used in professional chess and gaming

### 4. Match Logging

**Quick Match Log:**
- Modal shows recent 6 opponents in a grid
- One-click outcome selection (win/loss/draw)
- Instant rating calculation and feedback

**Admin Match Entry:**
- Admins can log matches between any two players
- Use case: Historical matches, corrections

**What Happens on Match Log:**
1. Validate both players on leaderboard
2. Fetch current ratings
3. Run Glicko-2 calculation
4. Create match record with participants
5. Update leaderboard ratings
6. Save rating history (for charts)
7. Update recent opponents (for quick-access)
8. Record activity and update streaks
9. Calculate and award XP
10. Check for achievements unlocked

### 5. Gamification: Daily Streaks

Consecutive days with at least 1 match logged.

**Protection Mechanisms:**
- **Freezes**: Earn 1 per 7-day streak (max 2 stored)
  - Use to skip 1 missed day without breaking streak
- **Weekend Amulet**: Skip weekends without breaking streak
  - Only if missing 2 days or less, all on weekends

**Streak Tiers:**
- Starting (1-2 days): Gray
- Building (3-6 days): Light orange
- On Fire (7-13 days): Orange
- Blazing (14-29 days): Red
- Legendary (30-99 days): Purple
- Immortal (100+ days): Gold

**Milestones:** Achievements at 3, 7, 14, 30, 50, 100, 365 days

### 6. Gamification: Weekly Leagues

Tier-based competitive seasons that reset every Monday.

**Tiers (based on total XP):**
- Bronze (0-99 XP): Entry level, no demotion
- Silver (100-299 XP)
- Gold (300-599 XP)
- Platinum (600-999 XP)
- Diamond (1000-1999 XP)
- Champion (2000+ XP)

**XP System:**
- Win: 15 XP
- Draw: 10 XP
- Loss: 5 XP (participation)
- Upset bonus: +5 to +12 XP (based on rating difference)
- Streak bonus: +2 XP per day (max +10 for 5+ day streak)

**Weekly Reset (Monday 00:00 UTC):**
1. Finalize rankings by weekly XP
2. Promote top performers (varies by tier: 5-20%)
3. Demote bottom performers (0-50% depending on tier)
4. Reset weekly XP to 0
5. Create new league groups (max 30 per league)

### 7. Challenges

Player-to-player duels.

**Flow:**
1. Send challenge with optional message (24-hour expiration)
2. Challenged player accepts or declines
3. Once accepted, both track it as "active"
4. When match is logged, challenge completes

**Status Types:** Pending, Accepted, Completed, Declined, Cancelled, Expired

### 8. Achievements

21 achievement types earned once each:

**First Milestones:**
- first_win, first_match

**Streak Achievements:**
- win_streak_3, win_streak_5, win_streak_10
- activity_streak_7, activity_streak_30, activity_streak_100

**Rating Milestones:**
- rating_1600, rating_1800, rating_2000

**Match Count:**
- matches_10, matches_50, matches_100

**Tier Achievements:**
- tier_silver, tier_gold, tier_platinum, tier_diamond, tier_champion

**Special:**
- upset_win (beat someone 100+ rating higher)
- league_winner (finish #1 in weekly league)

### 9. Invite System

**Features:**
- 8-character invite codes
- QR code generation for easy sharing
- Optional usage limits and expiration (default 7 days)
- Auto-approval for invited users
- Usage tracking

**Who Can Create:**
- Any org member can create invite links

### 10. Analytics & Activity

**Dashboard Stats:**
- Best rank across all leaderboards
- Top win streak
- Matches this week
- Total wins/losses/draws

**Recent Activity:**
- Feed of recent matches across all orgs
- Opponent, outcome, rating change, time

**Rivalries:**
- Top 5 most-played opponents
- Head-to-head record
- Last match time

**Ducking Alerts:**
- Players within 200 rating points
- Haven't played in 10+ days
- Encourages active engagement

---

## Database Schema (28 Tables)

### Core Tables
- `users`: Clerk-synced user records
- `organizations`: Gyms, clubs, teams
- `organizationMemberships`: User participation with status and roles
- `organizationInvites`: Shareable invite links

### Leaderboard Tables
- `leaderboards`: Ranking ladders within orgs
- `leaderboardRatings`: Glicko-2 ratings per player per leaderboard
- `matches`: Match records with outcomes
- `matchParticipants`: Per-player match data with rating snapshots
- `ratingHistory`: Time-series data for charts
- `recentOpponents`: Quick match logging optimization

### Gamification Tables
- `userStreaks`: Daily activity streaks with freezes
- `dailyActivity`: Per-day match and XP tracking
- `weeklyLeagues`: Tier-based seasons
- `leagueMemberships`: User participation in leagues
- `userXp`: Lifetime and weekly XP
- `userAchievements`: Unlocked achievements
- `challenges`: Player-to-player duels

### Notification Tables
- `pushSubscriptions`: Web push endpoints
- `notificationPreferences`: User notification settings

---

## API Structure (tRPC Routers)

### organizations
- `list`: Public orgs
- `getBySlug`: Single org
- `create`: Create org
- `join`: Join by ID
- `joinBySlug`: Join by slug
- `myOrganizations`: User's orgs
- `members`: Org members

### leaderboards
- `byOrganization`: Org's leaderboards
- `getById`: Single leaderboard
- `rankings`: Ranked players with streaks/changes
- `create`: Admin create leaderboard
- `myRating`: User's rating
- `join`: Join leaderboard

### matches
- `recentOpponents`: Top 6 recent opponents
- `byLeaderboard`: Matches on leaderboard
- `byMember`: Member's matches
- `create`: Log match (user)
- `adminCreate`: Log match (admin)
- `headToHead`: Stats between 2 players

### streaks
- `getMyStreak`: User's streak
- `recordActivity`: Log activity
- `useFreeze`: Use a freeze
- `toggleWeekendAmulet`: Toggle amulet
- `getActivityHistory`: Last N days
- `streakLeaderboard`: Top streaks

### leagues
- `getMyXp`: User's XP and tier
- `getCurrentLeague`: Current week's league
- `addXp`: Add XP
- `getHistory`: Past weeks

### challenges
- `send`, `accept`, `decline`, `cancel`, `complete`
- `getPending`: Pending challenges
- `getActive`: Active challenges
- `getHistory`: Past challenges

### activity
- `recentActivity`: Recent matches
- `dashboardStats`: Summary stats
- `duckingAlerts`: Who to play
- `orgStats`: Per-org summary
- `rivalries`: Top rivals

### rankings
- `myRankings`: All user rankings
- `myRankingsStats`: Summary stats
- `leaderboardPreview`: Top 3 + context

### invites
- `create`: Create invite
- `validate`: Validate code
- `accept`: Join via code
- `list`: Admin view invites
- `revoke`: Admin revoke

---

## Cron Jobs

### Weekly League Reset
- **Schedule**: Monday 00:00 UTC
- **Process**: Finalize rankings, promote/demote, reset weekly XP, create new leagues

### Streak Reminders
- **Schedule**: Every hour
- **Process**: Find users with active streaks who haven't logged today, at their preferred reminder time
- **Note**: Push notification sending not yet implemented (placeholder)

---

## Pages

### Public
- `/`: Landing page
- `/sign-up`, `/sign-in`: Clerk auth
- `/invite/[code]`: Invite landing
- `/join/[slug]`: Org join landing

### Authenticated
- `/dashboard`: User home with activity, stats, org cards
- `/dashboard/organizations`: All user's orgs
- `/dashboard/new-org`: Create org
- `/rankings`: All user rankings across orgs
- `/org/[slug]`: Org dashboard
- `/org/[slug]/leaderboard/[id]`: Individual leaderboard

---

## Current Limitations

- Push notifications not yet wired up (cron exists, needs web-push integration)
- No image uploads (using Clerk avatars only)
- Web-only (no mobile app)
- 1 match per day for streak calculations
- No rating decay for inactive players

---

## Potential Future Features

- Real-time match notifications (WebSockets)
- Mobile app (React Native)
- Tournament bracket generation
- Video integration for match recording
- Rating decay for long inactive periods
- Seasonal leagues with end-of-season rewards
- Admin analytics dashboard
- API for third-party integrations
- Bot integration for automated match logging

---

## Environment Variables

```
DATABASE_URL                          # PostgreSQL connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Clerk frontend
CLERK_SECRET_KEY                     # Clerk backend
CLERK_WEBHOOK_SECRET                 # Clerk webhook signing
CRON_SECRET                          # Vercel cron auth
```

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run Vitest
npm run db:push       # Push schema (dev)
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio
npm run db:seed       # Seed database
```
