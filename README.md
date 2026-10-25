# eFootball Kenya — Competitive Gaming & Tournament Ecosystem

**Every Match Counts. • Compete. Win. Rise.**

eFootball Kenya is a full-stack competitive esports tournament management, national & county Elo ranking, clan ecosystem, community hub, permitted gaming marketplace, and governance platform built for Kenyan eFootball players across Mobile (Android/iOS), PlayStation, Xbox, and PC.

> **Independent Community Disclaimer:** eFootball Kenya is an independent competitive gaming platform and is not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd.

---

## 1. Design System & Brand Identity (Section 2)

- **Primary Royal Blue:** `#1535D8`
- **eFootball-Inspired Yellow:** `#FDE500`
- **Deep Navy:** `#07143D`
- **Dark Blue Surface:** `#101D56`
- **Midnight Background:** `#080F25`
- **Championship Gold:** `#D4AF37`
- **Typography:** `Rajdhani Bold` (headings, match scores, rankings), `Inter` (body, forms, dashboards), `Space Grotesk` (promotional accents), `Barlow Condensed` (compact stat pills).

---

## 2. Architecture & Core Modules

1. **Authentication, Security & RBAC (`src/lib/services/auth.ts`):**
   - Registration, `bcryptjs` password hashing, signed JWT + persistent database sessions (`user_sessions`), session revocation, email verification tokens, password reset tokens, login rate-limiting (`auth_rate_limits`), and Role-Based Access Control (`PLAYER`, `VERIFIED_PLAYER`, `CLAN_CAPTAIN`, `SELLER`, `ORGANISER`, `MODERATOR`, `TOURNAMENT_ADMIN`, `FINANCE_ADMIN`, `CONTENT_EDITOR`, `SUPER_ADMIN`).
   - *Bootstrap Rule:* The first user registered on a fresh database is automatically granted `SUPER_ADMIN`, `MODERATOR`, `TOURNAMENT_ADMIN`, and `ORGANISER` roles.
2. **Tournament Engine & Automated Brackets (`src/lib/engine/bracket.ts`, `src/lib/services/tournaments.ts`):**
   - Supports 5 formats: `SINGLE_ELIMINATION` (with automatic power-of-2 bye placement and Round 1 bye auto-advancement), `DOUBLE_ELIMINATION` (Winners, Losers, and Grand Final brackets), `ROUND_ROBIN`, `GROUP_PLUS_KNOCKOUT` (snake-seeded groups), and `LEAGUE_SEASON`.
   - Waitlist overflow queue with automatic promotion when a confirmed player withdraws before bracket lock.
3. **Match Rooms, Dual-Submission Verification & Dispute Tribunal (`src/lib/services/tournaments.ts`):**
   - Dedicated Match Rooms (`/matches/[matchId]`) with pre-match check-in, private evidence uploads (`PRIVATE_MATCH` server-side access control), match chat, and dual-score submission.
   - Matching scores submitted by Player 1 and Player 2 automatically verify the match, trigger Elo calculations, and advance the winner.
   - Conflicting scores automatically lock the match into `DISPUTED` state, block bracket progression, and open a Moderation Tribunal case.
   - **Conflict-of-Interest Protection:** Moderators are blocked from resolving any dispute in which they are a match participant.
4. **National & 47-County Elo Rating Engine (`src/lib/engine/elo.ts`):**
   - Standard Elo rating system ($K = 32$, initial rating $1200$).
   - Idempotent per verified tournament match (`rating_history` unique constraint). Friendly and unverified matches never alter official rankings.
5. **Clans, Community Feed, Editorial News & Highlights (`src/lib/services/clans-community.ts`):**
   - Clan creation, join approval workflow, captain announcements, moderated community posts/comments/reactions, and news/livestream highlight articles.
6. **Permitted KES Gaming Marketplace & Double-Entry Ledger (`src/lib/services/marketplace-finance-admin.ts`):**
   - Strict keyword and category enforcement blocking prohibited account trading, coin generators, and gambling services.
   - Full order lifecycle (`PENDING` -> `ACCEPTED` -> `DELIVERED` -> `CONFIRMED` / `DISPUTED` / `CANCELLED`).
   - Auditable double-entry KES ledger (`ledger_accounts`, `ledger_entries`) and idempotent M-Pesa STK Push payment requests gated by compliance feature flags (`MPESA_PAYMENTS_ENABLED`, `PAID_TOURNAMENTS_ENABLED`).

---

## 3. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Initialize relational database schema & system defaults (zero fake data)
npm run db:init

# 3. Run unit, integration & E2E test suite
npm test

# 4. Start development server
npm run dev

# 5. Production build
npm run build
npm start
```

---

## 4. External Provider & Legal Compliance Activation Checklist

All core platform features run out of the box. To activate external third-party integrations in production, configure `.env.local` (see `.env.example`):

- **Safaricom Daraja M-Pesa (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`):** Required before enabling `MPESA_PAYMENTS_ENABLED` in `/admin/settings`. Paid entry fees and cash prize pools (`PAID_TOURNAMENTS_ENABLED`) also require Kenyan regulatory legal clearance (Section 22).
- **Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`):** Required to enable 1-click Google Sign-In via `/api/auth/google`.
- **Transactional Email (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) & SMS (`AFRICAS_TALKING_API_KEY`):** Used for external delivery of email verification links, password reset links, and SMS match reminders.
