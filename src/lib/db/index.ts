// ============================================================================
// eFootball Kenya — Relational SQL Database Engine (Section 28 Schema)
// Uses Node.js built-in relational SQLite engine with ACID transactions & FKs,
// matching prisma/schema.prisma 1:1 for zero-config execution and testing.
// ============================================================================

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MARKETPLACE_PERMITTED_CATEGORIES } from "@/lib/constants/kenya";

let dbInstance: DatabaseSync | null = null;
let currentDbPath: string | null = null;

export function createId(prefix = "efk"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function setDatabasePathForTests(customPath: string) {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close errors
    }
    dbInstance = null;
  }
  currentDbPath = customPath;
}

export function getDb(): DatabaseSync {
  const resolvedPath =
    currentDbPath ??
    process.env.SQLITE_DB_PATH ??
    path.join(process.cwd(), "data", "efootball_kenya.db");

  if (dbInstance && currentDbPath === resolvedPath) {
    return dbInstance;
  }

  if (resolvedPath !== ":memory:") {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(resolvedPath);
  db.exec("PRAGMA foreign_keys = ON;");
  if (resolvedPath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
  }

  initializeSchema(db);
  seedSystemDefaults(db);

  dbInstance = db;
  currentDbPath = resolvedPath;
  return db;
}

export function resetDatabaseForTests(): DatabaseSync {
  setDatabasePathForTests(":memory:");
  return getDb();
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
    -- 1. USERS & AUTHENTICATION
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT,
      email_verified_at TEXT,
      phone_verified_at TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      suspension_reason TEXT,
      age_confirmed INTEGER NOT NULL DEFAULT 1,
      terms_accepted_at TEXT NOT NULL,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      county TEXT NOT NULL,
      platform TEXT NOT NULL,
      efootball_id TEXT,
      bio TEXT,
      avatar_url TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      university TEXT,
      clan_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      created_at TEXT NOT NULL,
      UNIQUE(provider, provider_account_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      purpose TEXT NOT NULL DEFAULT 'EMAIL_VERIFY',
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_platform_ids (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, platform)
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      granted_by TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, role)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      reduced_motion INTEGER NOT NULL DEFAULT 0,
      allow_challenges INTEGER NOT NULL DEFAULT 1,
      profile_public INTEGER NOT NULL DEFAULT 1,
      timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
      updated_at TEXT NOT NULL
    );

    -- 2. TOURNAMENTS & MATCHES
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      banner_url TEXT,
      category TEXT NOT NULL,
      format TEXT NOT NULL,
      platform TEXT NOT NULL,
      region TEXT NOT NULL DEFAULT 'National',
      status TEXT NOT NULL DEFAULT 'REGISTRATION_OPEN',
      min_participants INTEGER NOT NULL DEFAULT 4,
      max_participants INTEGER NOT NULL DEFAULT 16,
      registration_open_at TEXT NOT NULL,
      registration_deadline TEXT NOT NULL,
      start_date TEXT NOT NULL,
      entry_requirement TEXT NOT NULL DEFAULT 'Free Entry — Open to Verified Kenyan Players',
      prize_details TEXT,
      sponsor_name TEXT,
      livestream_url TEXT,
      seeding_mode TEXT NOT NULL DEFAULT 'SEEDED',
      is_featured INTEGER NOT NULL DEFAULT 0,
      organiser_id TEXT NOT NULL REFERENCES users(id),
      winner_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_rules (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL UNIQUE REFERENCES tournaments(id) ON DELETE CASCADE,
      match_duration_mins INTEGER NOT NULL DEFAULT 10,
      extra_time_enabled INTEGER NOT NULL DEFAULT 1,
      penalties_enabled INTEGER NOT NULL DEFAULT 1,
      check_in_window_mins INTEGER NOT NULL DEFAULT 15,
      grace_period_mins INTEGER NOT NULL DEFAULT 15,
      result_deadline_mins INTEGER NOT NULL DEFAULT 60,
      rules_content TEXT NOT NULL,
      dispute_policy TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_registrations (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      registered_at TEXT NOT NULL,
      withdrawn_at TEXT,
      UNIQUE(tournament_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tournament_groups (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_participants (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seed INTEGER NOT NULL,
      group_id TEXT REFERENCES tournament_groups(id) ON DELETE SET NULL,
      points INTEGER NOT NULL DEFAULT 0,
      played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      goals_for INTEGER NOT NULL DEFAULT 0,
      goals_against INTEGER NOT NULL DEFAULT 0,
      eliminated INTEGER NOT NULL DEFAULT 0,
      UNIQUE(tournament_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tournament_rounds (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      bracket_side TEXT NOT NULL DEFAULT 'WINNERS',
      scheduled_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tournament_brackets (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      bracket_type TEXT NOT NULL DEFAULT 'MAIN',
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
      round_id TEXT REFERENCES tournament_rounds(id) ON DELETE SET NULL,
      group_id TEXT REFERENCES tournament_groups(id) ON DELETE SET NULL,
      round_number INTEGER NOT NULL DEFAULT 1,
      round_label TEXT NOT NULL DEFAULT 'Round 1',
      match_number INTEGER NOT NULL DEFAULT 1,
      bracket_side TEXT NOT NULL DEFAULT 'WINNERS',
      player_one_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      player_two_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      player_one_score INTEGER,
      player_two_score INTEGER,
      winner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      next_match_id TEXT,
      next_match_slot INTEGER,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      scheduled_at TEXT NOT NULL,
      reporting_deadline TEXT,
      verified_at TEXT,
      rating_processed INTEGER NOT NULL DEFAULT 0,
      is_friendly INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
      submitted_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player_one_score INTEGER NOT NULL,
      player_two_score INTEGER NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      submitted_at TEXT NOT NULL,
      UNIQUE(match_id, submitted_by_id)
    );

    CREATE TABLE IF NOT EXISTS match_evidence (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
      uploaded_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      caption TEXT,
      is_private INTEGER NOT NULL DEFAULT 1,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_checkins (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      checked_in_at TEXT NOT NULL,
      UNIQUE(match_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tournament_announcements (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 3. RANKINGS, SEASONS & ACHIEVEMENTS
    CREATE TABLE IF NOT EXISTS player_ratings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL DEFAULT 1200,
      peak_rating INTEGER NOT NULL DEFAULT 1200,
      last_rating_change INTEGER NOT NULL DEFAULT 0,
      matches_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      goals_scored INTEGER NOT NULL DEFAULT 0,
      goals_conceded INTEGER NOT NULL DEFAULT 0,
      tournaments_played INTEGER NOT NULL DEFAULT 0,
      tournaments_won INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rating_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
      season_id TEXT,
      old_rating INTEGER NOT NULL,
      new_rating INTEGER NOT NULL,
      rating_delta INTEGER NOT NULL,
      k_factor INTEGER NOT NULL DEFAULT 32,
      expected_score REAL NOT NULL,
      actual_score REAL NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, match_id)
    );

    CREATE TABLE IF NOT EXISTS ranking_seasons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL REFERENCES ranking_seasons(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      wins INTEGER NOT NULL,
      matches INTEGER NOT NULL,
      county TEXT NOT NULL,
      platform TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'BLUE',
      awarded_at TEXT NOT NULL,
      source_id TEXT,
      UNIQUE(user_id, code)
    );

    -- 4. CLANS & TEAMS
    CREATE TABLE IF NOT EXISTS clans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      tag TEXT NOT NULL UNIQUE COLLATE NOCASE,
      slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
      description TEXT NOT NULL,
      county TEXT NOT NULL,
      logo_url TEXT,
      founder_id TEXT NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL DEFAULT 1200,
      wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clan_members (
      id TEXT PRIMARY KEY,
      clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      joined_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clan_invitations (
      id TEXT PRIMARY KEY,
      clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      invited_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clan_challenges (
      id TEXT PRIMARY KEY,
      challenger_clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      defender_clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clan_results (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      clan_one_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      clan_two_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      clan_one_score INTEGER NOT NULL,
      clan_two_score INTEGER NOT NULL,
      winner_clan_id TEXT,
      verified_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clan_announcements (
      id TEXT PRIMARY KEY,
      clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 5. DISPUTES & MODERATION
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
      opened_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      assigned_id TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS dispute_evidence (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
      uploaded_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dispute_messages (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dispute_decisions (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
      moderator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ruling TEXT NOT NULL,
      player_one_score INTEGER,
      player_two_score INTEGER,
      winner_id TEXT,
      reasoning TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dispute_appeals (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL UNIQUE REFERENCES disputes(id) ON DELETE CASCADE,
      appellant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reviewed_by TEXT,
      review_notes TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    -- 6. COMMUNITY & FRIENDLY CHALLENGES
    CREATE TABLE IF NOT EXISTS player_follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS player_blocks (
      id TEXT PRIMARY KEY,
      blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(blocker_id, blocked_id)
    );

    CREATE TABLE IF NOT EXISTS friendly_challenges (
      id TEXT PRIMARY KEY,
      challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opponent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      proposed_time TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      match_id TEXT REFERENCES tournament_matches(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL DEFAULT 'FIRE',
      created_at TEXT NOT NULL,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      reviewed_by TEXT,
      created_at TEXT NOT NULL
    );

    -- 7. MARKETPLACE
    CREATE TABLE IF NOT EXISTS marketplace_categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_permitted INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS seller_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      county TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      rating_avg REAL NOT NULL DEFAULT 5.0,
      total_sales INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES marketplace_categories(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price_kes INTEGER NOT NULL,
      fulfilment_terms TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT 'IN_STOCK',
      moderation_state TEXT NOT NULL DEFAULT 'APPROVED',
      is_featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS marketplace_orders (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES marketplace_listings(id),
      buyer_id TEXT NOT NULL REFERENCES users(id),
      seller_id TEXT NOT NULL REFERENCES seller_profiles(id),
      amount_kes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      buyer_notes TEXT,
      delivery_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS marketplace_disputes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
      opened_by_id TEXT NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      resolution TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS seller_reviews (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES users(id),
      order_id TEXT NOT NULL UNIQUE REFERENCES marketplace_orders(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL
    );

    -- 8. FINANCE & LEDGER
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL DEFAULT 'MPESA_DARAJA',
      purpose TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      amount_kes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'DISABLED_BY_COMPLIANCE',
      checkout_req_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      payment_request_id TEXT NOT NULL REFERENCES payment_requests(id),
      provider_receipt TEXT NOT NULL UNIQUE,
      amount_kes INTEGER NOT NULL,
      raw_callback_json TEXT NOT NULL,
      verified_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_accounts (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KES',
      balance_kes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      amount_kes INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payout_requests (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL REFERENCES users(id),
      amount_kes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'DISABLED_BY_COMPLIANCE',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      payment_request_id TEXT NOT NULL REFERENCES payment_requests(id),
      amount_kes INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_kes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'RECONCILED',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reconciliation_records (
      id TEXT PRIMARY KEY,
      statement_date TEXT NOT NULL,
      ledger_total_kes INTEGER NOT NULL,
      provider_kes INTEGER NOT NULL,
      discrepancy_kes INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      reconciled_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 9. CONTENT, NEWS, HIGHLIGHTS & SPONSORS
    CREATE TABLE IF NOT EXISTS article_categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES article_categories(id),
      author_id TEXT NOT NULL REFERENCES users(id),
      cover_url TEXT,
      video_embed TEXT,
      is_highlight INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      published_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      uploader_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      cta_text TEXT NOT NULL,
      cta_url TEXT NOT NULL,
      placement TEXT NOT NULL DEFAULT 'HOMEPAGE',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      website_url TEXT,
      tier TEXT NOT NULL DEFAULT 'OFFICIAL_PARTNER',
      description TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sponsorship_campaigns (
      id TEXT PRIMARY KEY,
      sponsor_id TEXT NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      placement TEXT NOT NULL,
      target_url TEXT NOT NULL,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );

    -- 10. SYSTEM, NOTIFICATIONS, AUDIT LOGS & FEATURE FLAGS
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link_url TEXT,
      read_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      in_app INTEGER NOT NULL DEFAULT 1,
      email INTEGER NOT NULL DEFAULT 1,
      sms INTEGER NOT NULL DEFAULT 0,
      web_push INTEGER NOT NULL DEFAULT 1,
      match_alerts INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feature_flags (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      enabled INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      compliance TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

function seedSystemDefaults(db: DatabaseSync) {
  const now = new Date().toISOString();

  // 1. Permitted Marketplace Categories
  const insertCat = db.prepare(`
    INSERT OR IGNORE INTO marketplace_categories (id, slug, name, description, is_permitted)
    VALUES (?, ?, ?, ?, 1)
  `);
  for (const cat of MARKETPLACE_PERMITTED_CATEGORIES) {
    insertCat.run(`mcat_${cat.slug}`, cat.slug, cat.name, cat.description);
  }

  // 2. Article Categories (Section 20)
  const articleCats = [
    { slug: "tournament-news", name: "Tournament News" },
    { slug: "player-spotlights", name: "Player Spotlights" },
    { slug: "gaming-tips", name: "Gaming Tips" },
    { slug: "formation-guides", name: "Formation Guides" },
    { slug: "match-highlights", name: "Match Highlights" },
    { slug: "community-news", name: "Community News" },
  ];
  const insertArtCat = db.prepare(`
    INSERT OR IGNORE INTO article_categories (id, slug, name)
    VALUES (?, ?, ?)
  `);
  for (const ac of articleCats) {
    insertArtCat.run(`acat_${ac.slug}`, ac.slug, ac.name);
  }

  // 3. Active Ranking Season
  db.prepare(`
    INSERT OR IGNORE INTO ranking_seasons (id, name, slug, start_date, end_date, is_active, created_at)
    VALUES ('season_2026_s1', 'Season 1 — 2026 Kenya National Split', '2026-season-1', '2026-01-01T00:00:00.000Z', '2026-12-31T23:59:59.000Z', 1, ?)
  `).run(now);

  // 4. Standard Double-Entry Ledger Accounts (Section 18)
  const ledgerAccounts = [
    { code: "1000-MPESA-SETTLEMENT", name: "M-Pesa Daraja Settlement Clearing", type: "ASSET" },
    { code: "2000-MERCHANT-PAYABLES", name: "Marketplace Seller Pending Payables", type: "LIABILITY" },
    { code: "4000-PLATFORM-COMMISSION", name: "Marketplace Commission Revenue", type: "REVENUE" },
    { code: "4100-SPONSORSHIP-REV", name: "Sponsorship & Advertising Revenue", type: "REVENUE" },
  ];
  const insertLedger = db.prepare(`
    INSERT OR IGNORE INTO ledger_accounts (id, code, name, account_type, currency, balance_kes, created_at)
    VALUES (?, ?, ?, ?, 'KES', 0, ?)
  `);
  for (const la of ledgerAccounts) {
    insertLedger.run(`lacc_${la.code}`, la.code, la.name, la.type, now);
  }

  // 5. Compliance & Regulated Feature Flags (Section 18, 22, 32, 35)
  const flags = [
    {
      key: "MPESA_PAYMENTS_ENABLED",
      enabled: 0,
      description: "Safaricom Daraja M-Pesa STK Push & C2B/B2C payment processing.",
      compliance: "Disabled until Safaricom Daraja production credentials & CBK/legal approvals are verified.",
    },
    {
      key: "PAID_ENTRY_TOURNAMENTS_ENABLED",
      enabled: 0,
      description: "Allow tournaments with paid KES entry fees.",
      compliance: "Disabled per Kenyan regulatory requirements; all tournaments operate as Free Entry.",
    },
    {
      key: "CASH_PRIZES_PAYOUT_ENABLED",
      enabled: 0,
      description: "Automated B2C cash prize disbursements.",
      compliance: "Disabled until regulatory & payment-provider approvals are satisfied.",
    },
    {
      key: "STORED_VALUE_WALLET_ENABLED",
      enabled: 0,
      description: "Player stored-value wallet and escrow balances.",
      compliance: "Disabled; requires licensed PSP / CBK authorization.",
    },
    {
      key: "PREMIUM_MEMBERSHIP_BILLING_ENABLED",
      enabled: 0,
      description: "Recurring KES 200-500/month cosmetic & analytics subscription billing.",
      compliance: "Disabled until payment gateway & tax compliance sign-off.",
    },
  ];
  const insertFlag = db.prepare(`
    INSERT OR IGNORE INTO feature_flags (id, key, enabled, description, compliance, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const f of flags) {
    insertFlag.run(`flag_${f.key.toLowerCase()}`, f.key, f.enabled, f.description, f.compliance, now);
  }

  // 6. System Settings
  const settings = [
    { key: "DEFAULT_ELO_RATING", value: "1200", description: "Starting Elo rating for newly registered players." },
    { key: "DEFAULT_K_FACTOR", value: "32", description: "Standard Elo K-factor for official verified matches." },
    { key: "CHECKIN_WINDOW_MINS", value: "15", description: "Minutes before scheduled match start that check-in opens." },
    { key: "NO_SHOW_GRACE_PERIOD_MINS", value: "15", description: "Grace period before a walkover claim can be submitted for moderator review." },
    { key: "MIN_ELIGIBLE_AGE", value: "13", description: "Minimum age required to register an eFootball Kenya account." },
  ];
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (id, key, value, description, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const s of settings) {
    insertSetting.run(`sys_${s.key.toLowerCase()}`, s.key, s.value, s.description, now);
  }
}
