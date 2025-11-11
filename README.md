# LocalElo

**LocalElo** is a multi-organization Elo ranking and match analytics platform built on Rails 7. It gives martial arts academies, racket clubs, esports teams, and other competitive communities a turnkey way to manage gyms, log matches, and surface actionable performance insights for every athlete. LocalElo combines a polished Hotwire-powered UI with robust match validation, membership workflows, and extensible APIs so that club operators can scale friendly competition without spreadsheets.

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Feature Highlights](#feature-highlights)
3. [System Architecture](#system-architecture)
4. [Data Model](#data-model)
5. [Front-End Experience](#front-end-experience)
6. [APIs & Integrations](#apis--integrations)
7. [Security & Access Control](#security--access-control)
8. [Getting Started](#getting-started)
9. [Local Development Workflow](#local-development-workflow)
10. [Quality & Testing](#quality--testing)
11. [Seeding Reference Data](#seeding-reference-data)
12. [Deployment Notes](#deployment-notes)
13. [Project Structure](#project-structure)
14. [Troubleshooting & FAQ](#troubleshooting--faq)
15. [Contributing](#contributing)
16. [License](#license)

---

## Product Overview
LocalElo is designed for organizations that need to:

- Operate **multiple gyms/organizations**, each with its own private membership roster and leaderboards.
- Log **head-to-head matches** with auditable Elo updates and match history.
- Give members a **personal dashboard** that spotlights recent activity, trending performance, and actionable tips.
- Provide **admins and owners** streamlined tools to approve members, manage leaderboards, and moderate results.
- Deliver **real-time updates** via Hotwire so that rankings, match feeds, and analytics stay fresh without constant page reloads.

Whether you are running a Brazilian Jiu-Jitsu academy, a table tennis club, or an esports ladder, LocalElo keeps competition transparent, fair, and engaging.

---

## Feature Highlights

### Organizations & Memberships
- Create public (open) or restricted organizations with designated owners.
- Auto-approve or queue membership requests depending on visibility.
- Promote/demote admins and transfer ownership securely.
- Track pending, approved, and banned members with clear workflows.

### Leaderboards & Ratings
- Model as many leaderboards per organization as you need (e.g., "No-Gi Advanced", "Blitz Chess").
- Automatically enroll every approved member with a 1500 starting Elo.
- Maintain `LeaderboardRating` records with win/loss counters and rating history.

### Match Logging & Validation
- Dedicated match logging form that pre-filters valid opponents per leaderboard.
- Elo adjustments are triggered automatically after each match, including draw handling.
- Turbo-powered opponent updates and inline validation ensure members can only play eligible opponents.

### Athlete Dashboards
- Personalized landing page that highlights match trends, Elo history, and win/loss breakdowns.
- Stimulus and Chart.js visualizations for Elo progression and activity comparisons.
- Intelligent tips nudging athletes to stay active, join more organizations, or celebrate gains.

### Analytics & History
- Persist `EloHistory` snapshots for every rating change to support charts and trend analysis.
- Summaries of most active leaderboards, frequent opponents, and recent match feeds.

### Background Job Support
- Sidekiq-ready job queue (`EloCalculationJob`) for future asynchronous Elo recalculations or scheduled tasks.
- Cron integration prepared via `sidekiq-cron` for recurring maintenance or report generation.

### Hotwire Front-End
- Turbo Frames keep dashboards responsive and eliminate manual page refreshes.
- Stimulus controllers orchestrate dropdowns, mobile navigation, toasts, and performance cards.
- Tailwind CSS drives a modern, responsive design system suitable for desktop and mobile.

---

## System Architecture

LocalElo follows a classic Rails MVC architecture with modern Hotwire enhancements:

- **Rails 7.1** application backed by **PostgreSQL**.
- **Devise** secures authentication (registration, login, password recovery).
- **Stimulus/Turbo** deliver realtime-feeling UX without a heavy SPA rewrite.
- **Tailwind CSS** powers design tokens, layout primitives, and responsive utilities.
- **Sidekiq + Redis** (expected in production) handle background jobs and scheduled tasks.
- **Active Storage** (using your choice of service) stores user avatars.

The codebase organizes domain logic in POROs and Rails models, keeping controllers concise and deferring heavy lifting to service objects (see `app/services/`) and form objects (see `app/form_objects/`) where appropriate.

---

## Data Model

| Entity | Purpose | Key Relationships |
| --- | --- | --- |
| `User` | Authenticated athlete/admin. Stores profile + avatar. | `has_many :organizations` (through memberships), `has_many :leaderboards` (through ratings), `has_many :matches` (as player/opponent/winner). |
| `Organization` | Represents a gym/club. Tracks visibility, memberships, and role assignments. | `has_many :leaderboards`, `has_many :matches` (through leaderboards). |
| `OrganizationMembership` | Joins profiles to organizations and records join status. | Validates uniqueness, supports scopes (`pending`, `approved`, `banned`). |
| `OrganizationRole` | Links approved memberships to elevated privileges (admin/owner). | `belongs_to :organization`, `belongs_to :organization_membership`; enforces single owner per org. |
| `Leaderboard` | Defines a ladder or ranking table inside an organization. | `has_many :leaderboard_ratings`, `has_many :matches`. Auto-enrolls existing members. |
| `LeaderboardRating` | Stores a member's Elo, wins, and losses for a leaderboard. | `belongs_to :user`, `belongs_to :leaderboard`; updated after matches. |
| `Match` | Records a single contest, winner, draw status, and Elo delta. | Validates both players belong to the leaderboard; triggers Elo adjustments + history logging. |
| `EloHistory` | Snapshots Elo over time for charting and analytics. | `belongs_to :user`, typically appended after each match. |

> **Need the bigger picture?** Review the [Domain Concepts Inventory](docs/concepts.md) for end-to-end definitions, state diagrams, and synchronization rules that keep these entities aligned.

---

## Front-End Experience

- **Dashboard** – Personalized summary at `/dashboard` with match feeds, charts, and leaderboards.
- **Organizations** – Browse, join, and manage organizations at `/organizations`. Owners can edit, delete, approve members, and review rosters.
- **Match Logging** – Launch the guided form from a CTA on organization or leaderboard pages to quickly record results.
- **Responsive UI** – Tailwind ensures comfortable viewing on tablets and phones. Stimulus controllers power mobile menus, dropdowns, and toast notifications.

For deep customization, inspect the Stimulus controllers under `app/javascript/controllers` and the Tailwind configuration under `config/tailwind.config.js` (if customized) to align styling with your brand.

---

## APIs & Integrations

LocalElo ships with a versioned JSON API (`/api/v1`) ready for mobile apps or third-party services. Key endpoints include:

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/organizations` | List organizations (extendable for filters/search).
| `POST /api/v1/organizations/:id/join` | Request to join or auto-join based on visibility.
| `GET /api/v1/organizations/:id/leaderboards` | Fetch leaderboards and rankings for an organization.
| `GET /api/v1/leaderboard_ratings/:id` | Retrieve detailed rating stats for a user.
| `POST /api/v1/matches` | Submit match results programmatically (subject to validations).
| `GET /api/v1/users/:id` | Access public athlete profiles and standings.

Authentication strategy for the API is pluggable—add token-based auth (e.g., Doorkeeper, JWT) before exposing the API publicly.

---

## Security & Access Control

- **Authentication**: Devise handles sign-in, session management, and password recovery.
- **Authorization**: Owner/admin checks are embedded in controllers (`OrganizationsController#authorize_admin!`) and models to restrict sensitive actions.
- **Data Integrity**: Match validations prevent self-play, enforce membership eligibility, and guarantee winner consistency. Elo updates run in database transactions for atomicity.
- **Sensitive Configuration**: Rails credentials (`config/credentials.yml.enc`) or `ENV` variables should store secrets like database passwords, Active Storage credentials, and Sidekiq Redis URLs.

---

## Getting Started

### Prerequisites
- **Ruby** 3.2.2 (manage via rbenv, rvm, or asdf).
- **Bundler** 2.x (`gem install bundler`).
- **Node.js** 18+ and **npm** (for JS dependencies like Chart.js).
- **PostgreSQL** 13+ (local server + role with createdb privileges).
- **Redis** (required for Sidekiq in development/production; optional if not running jobs locally).

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-org>/localelo.git
cd localelo

# Install Ruby gems
bundle install

# Install JavaScript dependencies
npm install

# Set up database configuration (adjust credentials as needed)
cp config/database.yml config/database.local.yml  # optional pattern
# Edit config/database.yml with your local username/password

# Prepare the database (creates, migrates, seeds optional fixtures)
bin/rails db:setup
```

> **Heads up:** `db:setup` leverages FactoryBot in `db/seeds.rb`. Ensure the development/test dependencies in the Gemfile are installed (Bundler handles this by default in development).

---

## Local Development Workflow

- **Start the app**: `bin/dev` uses the included `Procfile.dev` to boot the Rails server and Tailwind watcher simultaneously.
- **Alternate start**: `bin/rails server` (backend only) and `bin/rails tailwindcss:watch` (styles) in separate terminals.
- **Background jobs**: `bundle exec sidekiq` (requires Redis). Add jobs to `app/jobs/` and enqueue via `perform_async` as needed.
- **Hot reloading**: Turbo Streams and Stimulus controllers enable snappy UI updates without extra configuration.
- **JavaScript**: Additional Stimulus controllers can be generated with `./bin/rails generate stimulus <name>`.

---

## Quality & Testing

- **RSpec** (`spec/`) is the primary test framework. Run the full suite with:
  ```bash
  bundle exec rspec
  ```
- **System Tests** use Capybara + Selenium for end-to-end coverage (ensure ChromeDriver/GeckoDriver available if enabling).
- **FactoryBot** and **Faker** seed consistent test data across specs and seeds.
- **Static analysis**: Add RuboCop or StandardRB if you prefer automated linting (not bundled yet).
- **JavaScript tests**: Currently none; integrate Jest/Vitest if front-end coverage is required.

Adopt CI (GitHub Actions, CircleCI) to run `bundle exec rspec` and `bin/rails test` on every pull request.

---

## Seeding Reference Data

`db/seeds.rb` provisions a complete demo environment:

- 1 admin + 20 member accounts (`admin@example.com` / `password123`, `user1@example.com` … `user20@example.com`).
- 3 sample organizations (Chess Club, Table Tennis, BJJ) with varied visibility settings.
- Leaderboards with auto-generated ratings and 30 historical matches each.

Run:
```bash
bin/rails db:seed
```

Feel free to tailor the seed script for your sport or import CSVs via ActiveAdmin/Service Objects.

---

## Deployment Notes

- **Environment Variables**: Ensure `RAILS_MASTER_KEY`, database credentials, Redis URL, and storage credentials are present.
- **Database Migrations**: Run `bin/rails db:migrate` during deployments.
- **Assets**: Tailwind builds automatically via Rails asset pipeline; precompile with `bin/rails assets:precompile` for production.
- **Background Jobs**: Provision Redis and run Sidekiq workers alongside the web dyno/process.
- **Cron/Scheduling**: Configure `sidekiq-cron` YAML to schedule maintenance tasks (e.g., recalculating historical Elo).
- **SSL & Proxy**: Follow Rails guides for SSL termination if deploying to Heroku, Render, Fly.io, etc.

---

## Project Structure

```
app/
  controllers/         # RESTful endpoints & Hotwire responses
  models/              # Domain models (Organization, Match, EloHistory...)
  views/               # ERB templates leveraging Turbo Frames
  javascript/          # Stimulus controllers & packs
  services/            # Plain Ruby service objects (e.g., Elo utilities)
  form_objects/        # Form objects for complex submission handling
config/                # Environments, routes, credentials
db/                    # Migrations and seeds
spec/                  # RSpec test suite, factories, request specs
bin/                   # Rails, Bundler, Tailwind executables
```

---

## Troubleshooting & FAQ

**Rails can’t connect to Postgres. What now?**  
Confirm your `config/database.yml` credentials match a local Postgres role with `createdb` privileges. Use `psql postgres` to verify connectivity, or set `RANKED_BJJ_DATABASE_PASSWORD` in your shell before running `bin/rails db:setup`.

**CSS changes aren’t appearing.**  
Ensure `bin/rails tailwindcss:watch` (or `bin/dev`) is running. Tailwind only rebuilds styles while the watcher is active.

**Stimulus controllers aren’t firing.**  
Verify they are registered in `app/javascript/controllers/index.js` and that your HTML has matching `data-controller` attributes.

**Sidekiq can’t connect to Redis.**  
Start a local Redis instance (e.g., `redis-server`) and set `REDIS_URL` if you’re not using the default `redis://localhost:6379/0`.

**How do I extend the API?**  
Add routes under `namespace :api do ... end` in `config/routes.rb`, build controller actions in `app/controllers/api/v1`, and create serializers (e.g., Jbuilder views) for response shaping. Introduce authentication middleware before exposing endpoints externally.

**Can I change the Elo algorithm?**  
Yes. Update constants like `K_FACTOR` in `Match`, or extract the rating logic into a dedicated service (e.g., `app/services/elo/`) for more advanced models (Glicko, TrueSkill, etc.).

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-improvement`).
2. Install dependencies and ensure the test suite passes (`bundle exec rspec`).
3. Commit with clear messages and open a Pull Request describing the motivation and solution.
4. Please include screenshots or Loom videos when UI changes are involved.
5. For significant changes (e.g., modifying Elo logic), open a discussion issue first to align on approach.

Security issues? Email the maintainers privately rather than opening a public issue.

---

## License

This project has not declared an open-source license. All rights reserved. Contact the repository owner for usage or distribution inquiries.

---

_Questions or ideas?_ Open an issue, start a discussion, or connect with the maintainers—LocalElo thrives on community feedback.
