# UI Design Guidelines: The Summary View Pattern

## Purpose

This document defines the standard pattern for **Summary Views** (also called "Show" pages or "Overview" pages) in LocalElo, based on concept-driven design principles from "The Essence of Software" by Daniel Jackson.

## The Kitchen Sink Anti-Pattern

### What is it?

The "Kitchen Sink" anti-pattern occurs when a single view tries to display EVERYTHING a user might need, creating redundancy, cognitive overload, and performance issues.

**Examples of violations:**
- Organization Overview tab showing Recent Matches (duplicates Matches tab)
- Organization Overview tab showing Top Players (duplicates Members tab)
- Matches Index page showing stats cards (belongs on Dashboard/Profile)

### Why is it bad?

1. **Redundancy**: Creates two ways to access the same information
2. **Cognitive Load**: Overwhelms users with too much data at once
3. **Performance**: Requires loading massive amounts of data from multiple concepts
4. **Purpose Confusion**: Violates the Specificity Principle - every view should have ONE clear purpose

## The Summary View Pattern

### Core Principle

**A Summary View (Show/Overview page) should ONLY contain:**
1. **Metadata** about the object itself
2. **Aggregate statistics** (counts, averages, totals)
3. **Contextual actions** (primary buttons for that object)

**A Summary View should NEVER contain:**
- Full lists of related objects (those belong in dedicated tabs/pages)
- Data that duplicates dedicated tabs
- User-specific data unless it's the user's own profile

---

## Implementation Rules

### Rule 1: One Purpose Per View

Every view must have a single, distinct purpose:

**✅ Good Examples:**
- **Organization Overview**: Purpose = "Understand what this gym is about and see its key metrics"
- **Matches Index**: Purpose = "Browse and filter ALL my matches"
- **Dashboard**: Purpose = "See a high-level summary of recent activity"

**❌ Bad Examples:**
- Organization Overview that shows Recent Matches, Top Players, Your Ratings, AND Leaderboards → This is 4 purposes in one view!

### Rule 2: Metadata vs. Related Data

**Metadata belongs in Summary Views:**
- Name, description, location, creation date
- Aggregate stats: "Total Members: 42", "Total Matches: 1,234"
- Static properties: visibility (public/private), website URL

**Related Data belongs in dedicated tabs/pages:**
- Lists of matches
- Lists of members
- Lists of leaderboards
- User-specific ratings

### Rule 3: Summary Views vs. Index Views

| View Type | Purpose | Should Contain | Example |
|-----------|---------|----------------|---------|
| **Summary (Show)** | Understand ONE specific object | Metadata, aggregate stats, contextual actions | `organizations/show.html.erb` Overview tab |
| **Index** | Browse/filter ALL objects of a type | Search, filters, paginated list | `matches/index.html.erb` |
| **Dashboard** | See high-level overview of multiple concepts | Small previews (3-5 items) with "View All" links | `dashboard/show.html.erb` |

### Rule 4: The "View All" Link Rule

**When to use a preview + "View All" link:**

If a Summary View needs to show related data for context, it must:
1. Limit the number of items (3-5 maximum)
2. Include a clear "View All" link to the dedicated view
3. Ensure the preview adds value (e.g., showing the top 3 leaderboards in an org)

**✅ Good Example (Dashboard Recent Activity):**
```erb
<!-- Show only 5 recent matches -->
<% matches.first(5).each do |match| %>
  <%= render "match_card", match: match %>
<% end %>

<!-- Clear link to full view -->
<%= link_to "View All", matches_path, class: "..." %>
```

**❌ Bad Example (Organization Overview showing ALL matches):**
```erb
<!-- No limit, no "View All" link -->
<% Match.where(organization: @organization).each do |match| %>
  <%= render "match_card", match: match %>
<% end %>
```

---

## Practical Examples

### ✅ Example 1: Organization Overview (organizations/show.html.erb)

**Purpose**: Understand what this gym is about and see its key metrics

**Should contain:**
- About section (description, website, location) ← Metadata
- Stats cards (Members count, Leaderboards count, Total Matches, Created date) ← Aggregate stats
- Join/Leave/Edit buttons ← Contextual actions
- Call-to-action for non-members ← Contextual invitation

**Should NOT contain:**
- Recent Matches list → Goes in "Matches" tab
- Top Players list → Goes in "Members" tab
- Your Ratings → Goes in "Members" tab or User Profile
- Leaderboards preview → Goes in "Leaderboards" tab

---

### ✅ Example 2: Profile Show (profiles/show.html.erb)

**Purpose**: Understand who this user is and see their performance

**Should contain:**
- Username, email, organization ← Metadata
- Stats cards (Total Matches, Wins, Losses, Win Rate) ← Aggregate stats
- Leaderboard Ratings section (limited to 3-5 with "View All") ← Brief preview
- Recent Matches section (limited to 5 with "View All") ← Brief preview

**Why this works**:
- The leaderboard ratings and matches ARE metadata about the user
- They're limited in scope and have clear "View All" links
- They provide context without overwhelming

---

### ❌ Example 3: Matches Index (OLD VERSION - Now Fixed)

**Purpose**: Browse and filter ALL my matches

**Should contain:**
- Search and filter controls
- Paginated table of matches
- "Log Match" button

**Should NOT contain:**
- Stats cards (Win Rate, Total Matches, Most Played Against) ← These belong on Dashboard or Profile

**Why**: An Index view is for BROWSING. Stats belong in summary contexts (Dashboard/Profile).

---

## Decision Tree: Where Does Content Belong?

Use this tree when deciding where to place content:

```
Is this content about ONE specific object?
├─ Yes → Summary View (Show page)
│  ├─ Is it metadata or aggregate stats?
│  │  └─ Yes → Include it in Overview
│  └─ Is it a list of related objects?
│     ├─ Is showing a preview (3-5 items) valuable for context?
│     │  └─ Yes → Show limited preview + "View All" link
│     └─ No → Put it in a dedicated tab
└─ No → Index View or Dashboard
   ├─ Is this for browsing/filtering many objects?
   │  └─ Yes → Index View (with search/filters/pagination)
   └─ Is this a cross-cutting overview?
      └─ Yes → Dashboard (with multiple limited previews)
```

---

## Checklist for New Views

Before creating or modifying a view, ask:

- [ ] Does this view have ONE clear purpose?
- [ ] Does it only show metadata and aggregate stats?
- [ ] Are all lists of related objects either:
  - [ ] Limited to 3-5 items with "View All" links, OR
  - [ ] Moved to dedicated tabs/pages?
- [ ] Does this view duplicate content from another tab/page?
- [ ] If this is a Dashboard widget, does it have a "View All" link?

---

## References

This guideline is based on:
- **The Specificity Principle**: One concept, one purpose ([CLAUDE.md](../CLAUDE.md))
- **Mapping Specificity**: Every view must have a distinct purpose
- **The Kitchen Sink Anti-Pattern**: Violations from Issues 6.1, 6.2, 6.3

---

## Enforcement

All pull requests that add or modify views must reference this guideline. Reviewers should check:
1. Does the view follow the Summary View Pattern?
2. Is there any Kitchen Sink content?
3. Are "View All" links present where needed?
