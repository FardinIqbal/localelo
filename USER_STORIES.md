# LocalElo User Stories

## Core User Personas

### Gym Owner / Club Admin (Sarah)
Runs a BJJ academy with 80 members across multiple skill levels.
Wants to create fair, motivating competition within her gym.

### Competitor (Marcus)
Active member who trains 4x/week.
Wants to track progress and know where he stands.

### Casual Member (Jake)
Trains occasionally, joins for fun.
Doesn't want complexity, just wants to see rankings.

---

## Phase 1: Core Flow (MVP)

### 1.1 First-time User
```
As a new user
I land on the homepage and immediately understand what LocalElo does
So I can decide if it's for me in under 5 seconds
```
**Acceptance:**
- Hero shows a live leaderboard preview
- Single CTA: "Get started"
- No scrolling required to understand

### 1.2 Create Organization
```
As Sarah (gym owner)
I create an organization in under 30 seconds
So I can start inviting my members
```
**Acceptance:**
- Only 2 fields: Name + URL slug
- Auto-generates slug from name
- Immediately redirected to org page

### 1.3 Invite Members
```
As Sarah
I share a single link with my members
So they can join without me manually adding each one
```
**Acceptance:**
- Copy invite link in one click
- Members sign up and auto-join org
- Optional: approval workflow for private orgs

### 1.4 Create Leaderboard
```
As Sarah
I create separate leaderboards for different skill levels
So beginners compete with beginners
```
**Acceptance:**
- Name only (description optional)
- All current members auto-added
- New members auto-added when they join

### 1.5 Log a Match
```
As Marcus
I log a match result in under 10 seconds
So I don't forget and ratings stay current
```
**Acceptance:**
- Select opponent from list
- Tap Win/Loss/Draw
- Instant rating update
- No confirmation needed (can undo)

### 1.6 View Rankings
```
As Jake
I see where I stand at a glance
So I know my rank without digging
```
**Acceptance:**
- Rankings sorted by rating
- Show rank number, name, rating
- Rating change since last match (+/-)
- Top 3 highlighted

---

## Phase 2: Engagement

### 2.1 Rating History
```
As Marcus
I see my rating over time
So I can track my improvement
```
**Acceptance:**
- Simple line chart
- Last 30 days default
- Can expand to all time

### 2.2 Head-to-Head
```
As Marcus
I see my record against specific opponents
So I know my nemesis
```
**Acceptance:**
- Tap any player to see H2H
- Shows W-L-D record
- Recent matches list

### 2.3 Activity Feed
```
As Jake
I see recent matches in my org
So I stay engaged with what's happening
```
**Acceptance:**
- Chronological match feed
- Shows "Marcus beat Jake (+24)"
- Tap to see details

### 2.4 Streaks & Stats
```
As Marcus
I see my current win streak
So I stay motivated
```
**Acceptance:**
- Current streak (wins/losses)
- Best streak ever
- Win rate percentage

---

## Phase 3: Social

### 3.1 Challenge
```
As Marcus
I challenge Jake to a match
So he gets notified and we schedule
```
**Acceptance:**
- Tap "Challenge" on any player
- Jake gets notification
- Can accept/decline

### 3.2 Match Confirmation
```
As Sarah
Both players must confirm a result
So rankings can't be gamed
```
**Acceptance:**
- Winner logs match
- Loser gets notification to confirm
- Auto-confirm after 24h if no response

### 3.3 Notifications
```
As Jake
I get notified when relevant things happen
So I stay engaged
```
**Acceptance:**
- Challenge received
- Match confirmed
- Rank changed
- Push + email options

---

## Phase 4: Advanced

### 4.1 Tournaments
```
As Sarah
I create a bracket tournament for my gym
So we have formal competition events
```

### 4.2 Teams
```
As Sarah
I track team matches (2v2, 3v3)
So crew battles have ratings too
```

### 4.3 Multiple Sports
```
As Marcus
I have ratings across BJJ, chess, and ping pong
So I track all my competitions
```

### 4.4 Public Profiles
```
As Marcus
I share my profile link
So others can see my rankings across orgs
```

---

## Design Principles

1. **Zero friction** - Every action takes < 3 taps
2. **Instant feedback** - Ratings update immediately
3. **Glanceable** - Key info visible without scrolling
4. **Progressive disclosure** - Advanced features hidden until needed
5. **Mobile-first** - Most logging happens on phones

---

## Success Metrics

- Time to first org creation: < 60 seconds
- Time to log a match: < 10 seconds
- Daily active users per org: > 30%
- Match logging rate: > 5 matches/member/week
