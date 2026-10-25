// ============================================================================
// eFootball Kenya — Tournament, Bracket, Match Room & Dispute Service
// Covers Sections 9, 10, 11, 12, 13, 14
// ============================================================================

import { getDb, createId } from "@/lib/db";
import { writeAuditLog, AuthenticatedUser, hasAnyRole } from "@/lib/services/auth";
import {
  generateTournamentFixturesAndBrackets,
  calculateStandings,
  canAdvanceBracketMatch,
  BracketParticipant,
} from "@/lib/engine/bracket";
import { computeMatchEloUpdate, evaluateUnlockedAchievements } from "@/lib/engine/elo";
import { ACHIEVEMENT_DEFINITIONS, TournamentFormatId } from "@/lib/constants/kenya";

export interface CreateTournamentInput {
  title: string;
  description: string;
  category: string;
  format: TournamentFormatId;
  platform: string;
  region?: string;
  minParticipants?: number;
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
  entryRequirement?: string;
  prizeDetails?: string;
  sponsorName?: string;
  livestreamUrl?: string;
  seedingMode?: "SEEDED" | "RANDOM";
  isFeatured?: boolean;
  matchDurationMins?: number;
  rulesContent?: string;
  disputePolicy?: string;
  organiserId: string;
  status?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createTournament(input: CreateTournamentInput) {
  const db = getDb();
  if (!input.title.trim()) {
    throw new Error("Tournament title is required.");
  }
  if (input.maxParticipants < 2 || input.maxParticipants > 256) {
    throw new Error("Maximum participants must be between 2 and 256.");
  }

  // Enforce Section 18 & 35 compliance: Paid-entry tournaments remain disabled until legally approved
  const paidFlag = db
    .prepare(`SELECT enabled FROM feature_flags WHERE key = 'PAID_ENTRY_TOURNAMENTS_ENABLED'`)
    .get() as { enabled: number } | undefined;

  if (
    !paidFlag?.enabled &&
    input.entryRequirement &&
    /kes\s*[1-9]|entry\s*fee\s*[:=]?\s*[1-9]/i.test(input.entryRequirement)
  ) {
    throw new Error(
      "Paid-entry tournaments are currently disabled under Kenyan compliance settings. All tournaments must be Free Entry."
    );
  }

  const id = createId("trn");
  const baseSlug = slugify(input.title) || "tournament";
  const slug = `${baseSlug}-${id.slice(-5)}`;
  const now = new Date().toISOString();
  const status = input.status || "REGISTRATION_OPEN";

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO tournaments (
        id, slug, title, description, category, format, platform, region, status,
        min_participants, max_participants, registration_open_at, registration_deadline,
        start_date, entry_requirement, prize_details, sponsor_name, livestream_url,
        seeding_mode, is_featured, organiser_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      slug,
      input.title.trim(),
      input.description.trim(),
      input.category,
      input.format,
      input.platform,
      input.region || "National",
      status,
      input.minParticipants ?? 2,
      input.maxParticipants,
      now,
      input.registrationDeadline,
      input.startDate,
      input.entryRequirement || "Free Entry — Open to Verified Kenyan Players",
      input.prizeDetails || null,
      input.sponsorName || null,
      input.livestreamUrl || null,
      input.seedingMode || "SEEDED",
      input.isFeatured ? 1 : 0,
      input.organiserId,
      now,
      now
    );

    db.prepare(`
      INSERT INTO tournament_rules (
        id, tournament_id, match_duration_mins, extra_time_enabled, penalties_enabled,
        check_in_window_mins, grace_period_mins, result_deadline_mins, rules_content, dispute_policy
      ) VALUES (?, ?, ?, 1, 1, 15, 15, 60, ?, ?)
    `).run(
      createId("trule"),
      id,
      input.matchDurationMins ?? 10,
      input.rulesContent ||
        "1. Standard eFootball Match Room settings (10 mins, Normal condition).\n2. Both players must check in within 15 minutes of kickoff.\n3. Both players must submit full-time scores and keep a clear screenshot of the final scoreboard.",
      input.disputePolicy ||
        "In case of conflicting score reports or connection drops, upload private scoreboard screenshots in the Match Room for Moderator review."
    );

    // Record community activity event
    db.prepare(`
      INSERT INTO activity_events (id, actor_id, event_type, title, body, link_url, created_at)
      VALUES (?, ?, 'ANNOUNCEMENT', ?, ?, ?, ?)
    `).run(
      createId("act"),
      input.organiserId,
      `New Tournament Announced: ${input.title.trim()}`,
      `Registration is now open for ${input.title.trim()} (${input.platform} • ${input.format.replace(/_/g, " ")}).`,
      `/tournaments/${slug}`,
      now
    );

    writeAuditLog({
      actorId: input.organiserId,
      action: "TOURNAMENT_CREATED",
      entityType: "TOURNAMENT",
      entityId: id,
      details: `Created tournament ${input.title.trim()} (${input.format})`,
    });

    db.exec("COMMIT");
    return getTournamentBySlugOrId(slug)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function listTournaments(filters?: {
  status?: string;
  platform?: string;
  category?: string;
  format?: string;
  search?: string;
  organiserId?: string;
  featuredOnly?: boolean;
}) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.status && filters.status !== "ALL") {
    conditions.push("t.status = ?");
    params.push(filters.status);
  }
  if (filters?.platform && filters.platform !== "ALL") {
    conditions.push("(t.platform = ? OR t.platform = 'CROSS_PLATFORM')");
    params.push(filters.platform);
  }
  if (filters?.category && filters.category !== "ALL") {
    conditions.push("t.category = ?");
    params.push(filters.category);
  }
  if (filters?.format && filters.format !== "ALL") {
    conditions.push("t.format = ?");
    params.push(filters.format);
  }
  if (filters?.organiserId) {
    conditions.push("t.organiser_id = ?");
    params.push(filters.organiserId);
  }
  if (filters?.featuredOnly) {
    conditions.push("t.is_featured = 1");
  }
  if (filters?.search?.trim()) {
    conditions.push("(t.title LIKE ? OR t.region LIKE ? OR t.description LIKE ?)");
    const q = `%${filters.search.trim()}%`;
    params.push(q, q, q);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(`
      SELECT
        t.*,
        u.username as organiser_username,
        (SELECT COUNT(*) FROM tournament_registrations tr WHERE tr.tournament_id = t.id AND tr.status = 'CONFIRMED') as registered_count,
        (SELECT COUNT(*) FROM tournament_registrations tr WHERE tr.tournament_id = t.id AND tr.status = 'WAITLISTED') as waitlist_count
      FROM tournaments t
      LEFT JOIN users u ON u.id = t.organiser_id
      ${whereClause}
      ORDER BY t.is_featured DESC, t.created_at DESC
    `)
    .all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    bannerUrl: r.banner_url,
    category: r.category,
    format: r.format as TournamentFormatId,
    platform: r.platform,
    region: r.region,
    status: r.status,
    minParticipants: Number(r.min_participants),
    maxParticipants: Number(r.max_participants),
    registeredCount: Number(r.registered_count ?? 0),
    waitlistCount: Number(r.waitlist_count ?? 0),
    registrationOpenAt: r.registration_open_at,
    registrationDeadline: r.registration_deadline,
    startDate: r.start_date,
    entryRequirement: r.entry_requirement,
    prizeDetails: r.prize_details,
    sponsorName: r.sponsor_name,
    livestreamUrl: r.livestream_url,
    seedingMode: r.seeding_mode,
    isFeatured: Boolean(r.is_featured),
    organiserId: r.organiser_id,
    organiserUsername: r.organiser_username,
    winnerId: r.winner_id,
    createdAt: r.created_at,
  }));
}

export function getTournamentBySlugOrId(slugOrId: string) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT t.*, u.username as organiser_username, wu.username as winner_username
      FROM tournaments t
      LEFT JOIN users u ON u.id = t.organiser_id
      LEFT JOIN users wu ON wu.id = t.winner_id
      WHERE t.slug = ? OR t.id = ?
    `)
    .get(slugOrId, slugOrId) as any;

  if (!row) return null;

  const rules = db
    .prepare(`SELECT * FROM tournament_rules WHERE tournament_id = ?`)
    .get(row.id) as any;

  const registrations = db
    .prepare(`
      SELECT
        tr.id, tr.user_id, tr.status, tr.registered_at,
        u.username, p.display_name, p.county, p.platform, p.avatar_url,
        COALESCE(r.rating, 1200) as rating,
        tp.seed
      FROM tournament_registrations tr
      JOIN users u ON u.id = tr.user_id
      LEFT JOIN profiles p ON p.user_id = tr.user_id
      LEFT JOIN player_ratings r ON r.user_id = tr.user_id
      LEFT JOIN tournament_participants tp ON tp.tournament_id = tr.tournament_id AND tp.user_id = tr.user_id
      WHERE tr.tournament_id = ? AND tr.status != 'WITHDRAWN'
      ORDER BY COALESCE(tp.seed, 9999) ASC, r.rating DESC, tr.registered_at ASC
    `)
    .all(row.id) as any[];

  const groups = db
    .prepare(`SELECT * FROM tournament_groups WHERE tournament_id = ? ORDER BY order_index ASC`)
    .all(row.id) as any[];

  const matches = db
    .prepare(`
      SELECT
        m.*,
        u1.username as player_one_username,
        p1.county as player_one_county,
        r1.rating as player_one_rating,
        u2.username as player_two_username,
        p2.county as player_two_county,
        r2.rating as player_two_rating,
        uw.username as winner_username,
        g.name as group_name
      FROM tournament_matches m
      LEFT JOIN users u1 ON u1.id = m.player_one_id
      LEFT JOIN profiles p1 ON p1.user_id = m.player_one_id
      LEFT JOIN player_ratings r1 ON r1.user_id = m.player_one_id
      LEFT JOIN users u2 ON u2.id = m.player_two_id
      LEFT JOIN profiles p2 ON p2.user_id = m.player_two_id
      LEFT JOIN player_ratings r2 ON r2.user_id = m.player_two_id
      LEFT JOIN users uw ON uw.id = m.winner_id
      LEFT JOIN tournament_groups g ON g.id = m.group_id
      WHERE m.tournament_id = ?
      ORDER BY m.round_number ASC, m.match_number ASC
    `)
    .all(row.id) as any[];

  const announcements = db
    .prepare(`
      SELECT a.*, u.username as author_username
      FROM tournament_announcements a
      JOIN users u ON u.id = a.author_id
      WHERE a.tournament_id = ?
      ORDER BY a.created_at DESC
    `)
    .all(row.id) as any[];

  const confirmedPlayers = registrations
    .filter((r) => r.status === "CONFIRMED")
    .map((r) => ({
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name || r.username,
      county: r.county || "Nairobi",
      platform: r.platform || "MOBILE",
      rating: Number(r.rating ?? 1200),
      seed: r.seed ? Number(r.seed) : undefined,
      registeredAt: r.registered_at,
    }));

  const waitlistedPlayers = registrations
    .filter((r) => r.status === "WAITLISTED")
    .map((r) => ({
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name || r.username,
      county: r.county || "Nairobi",
      platform: r.platform || "MOBILE",
      rating: Number(r.rating ?? 1200),
      registeredAt: r.registered_at,
    }));

  const formattedMatches = matches.map((m) => ({
    id: m.id,
    tournamentId: m.tournament_id,
    roundNumber: Number(m.round_number),
    roundLabel: m.round_label,
    matchNumber: Number(m.match_number),
    bracketSide: m.bracket_side,
    groupId: m.group_id,
    groupName: m.group_name,
    playerOneId: m.player_one_id,
    playerOneUsername: m.player_one_username,
    playerOneCounty: m.player_one_county,
    playerOneRating: m.player_one_rating ? Number(m.player_one_rating) : null,
    playerTwoId: m.player_two_id,
    playerTwoUsername: m.player_two_username,
    playerTwoCounty: m.player_two_county,
    playerTwoRating: m.player_two_rating ? Number(m.player_two_rating) : null,
    playerOneScore: m.player_one_score !== null ? Number(m.player_one_score) : null,
    playerTwoScore: m.player_two_score !== null ? Number(m.player_two_score) : null,
    winnerId: m.winner_id,
    winnerUsername: m.winner_username,
    nextMatchId: m.next_match_id,
    nextMatchSlot: m.next_match_slot ? Number(m.next_match_slot) : null,
    status: m.status,
    scheduledAt: m.scheduled_at,
    verifiedAt: m.verified_at,
  }));

  const standings = calculateStandings(
    confirmedPlayers.map((p) => ({ userId: p.userId, username: p.username })),
    formattedMatches.filter((m) => m.bracketSide === "LEAGUE" || m.bracketSide === "GROUP")
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    bannerUrl: row.banner_url,
    category: row.category,
    format: row.format as TournamentFormatId,
    platform: row.platform,
    region: row.region,
    status: row.status,
    minParticipants: Number(row.min_participants),
    maxParticipants: Number(row.max_participants),
    registeredCount: confirmedPlayers.length,
    waitlistCount: waitlistedPlayers.length,
    registrationOpenAt: row.registration_open_at,
    registrationDeadline: row.registration_deadline,
    startDate: row.start_date,
    entryRequirement: row.entry_requirement,
    prizeDetails: row.prize_details,
    sponsorName: row.sponsor_name,
    livestreamUrl: row.livestream_url,
    seedingMode: row.seeding_mode as "SEEDED" | "RANDOM",
    isFeatured: Boolean(row.is_featured),
    organiserId: row.organiser_id,
    organiserUsername: row.organiser_username,
    winnerId: row.winner_id,
    winnerUsername: row.winner_username,
    createdAt: row.created_at,
    rules: rules
      ? {
          matchDurationMins: Number(rules.match_duration_mins),
          extraTimeEnabled: Boolean(rules.extra_time_enabled),
          penaltiesEnabled: Boolean(rules.penalties_enabled),
          checkInWindowMins: Number(rules.check_in_window_mins),
          gracePeriodMins: Number(rules.grace_period_mins),
          resultDeadlineMins: Number(rules.result_deadline_mins),
          rulesContent: rules.rules_content,
          disputePolicy: rules.dispute_policy,
        }
      : null,
    participants: confirmedPlayers,
    waitlist: waitlistedPlayers,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      orderIndex: Number(g.order_index),
    })),
    matches: formattedMatches,
    standings,
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      authorUsername: a.author_username,
      createdAt: a.created_at,
    })),
  };
}

/**
 * Register a player for a tournament.
 * Enforces eligibility, duplicate prevention, slot capacity, and automatic waitlist overflow.
 */
export function registerForTournament(tournamentIdOrSlug: string, user: AuthenticatedUser) {
  const db = getDb();
  const tournament = getTournamentBySlugOrId(tournamentIdOrSlug);
  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Only active accounts in good standing may register for tournaments.");
  }

  if (tournament.status !== "REGISTRATION_OPEN" && tournament.status !== "PUBLISHED") {
    throw new Error(`Registration is currently closed (Status: ${tournament.status}).`);
  }

  // Platform compatibility check
  if (
    tournament.platform !== "CROSS_PLATFORM" &&
    tournament.platform !== user.platform
  ) {
    throw new Error(
      `Platform mismatch: This tournament requires ${tournament.platform}, and your primary platform is ${user.platform}. Update your profile platform or join a ${user.platform}/Cross-Platform event.`
    );
  }

  const existing = db
    .prepare(
      `SELECT id, status FROM tournament_registrations WHERE tournament_id = ? AND user_id = ?`
    )
    .get(tournament.id, user.id) as { id: string; status: string } | undefined;

  if (existing && (existing.status === "CONFIRMED" || existing.status === "WAITLISTED")) {
    throw new Error(`You are already registered for this tournament (${existing.status}).`);
  }

  const confirmedCountRow = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM tournament_registrations WHERE tournament_id = ? AND status = 'CONFIRMED'`
    )
    .get(tournament.id) as { cnt: number };

  const confirmedCount = Number(confirmedCountRow.cnt);
  const newStatus = confirmedCount < tournament.maxParticipants ? "CONFIRMED" : "WAITLISTED";
  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    if (existing) {
      db.prepare(
        `UPDATE tournament_registrations SET status = ?, registered_at = ?, withdrawn_at = NULL WHERE id = ?`
      ).run(newStatus, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO tournament_registrations (id, tournament_id, user_id, status, registered_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(createId("reg"), tournament.id, user.id, newStatus, now);
    }

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
      VALUES (?, ?, 'TOURNAMENT_REGISTRATION', ?, ?, ?, ?)
    `).run(
      createId("ntf"),
      user.id,
      newStatus === "CONFIRMED"
        ? `Registration Confirmed: ${tournament.title}`
        : `Waitlist Joined: ${tournament.title}`,
      newStatus === "CONFIRMED"
        ? `Your slot in ${tournament.title} is confirmed. You will be notified as soon as fixtures are generated.`
        : `${tournament.title} is currently full (${tournament.maxParticipants} slots). You have been placed on the official waitlist.`,
      `/tournaments/${tournament.slug}`,
      now
    );

    writeAuditLog({
      actorId: user.id,
      action: `TOURNAMENT_REGISTRATION_${newStatus}`,
      entityType: "TOURNAMENT",
      entityId: tournament.id,
      details: `${user.username} registered (${newStatus})`,
    });

    db.exec("COMMIT");
    return { status: newStatus, tournamentSlug: tournament.slug };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Withdraw from a tournament before it starts and automatically promote the first waitlisted player.
 */
export function withdrawFromTournament(tournamentIdOrSlug: string, user: AuthenticatedUser) {
  const db = getDb();
  const tournament = getTournamentBySlugOrId(tournamentIdOrSlug);
  if (!tournament) throw new Error("Tournament not found.");

  if (tournament.status === "IN_PROGRESS" || tournament.status === "COMPLETED") {
    throw new Error("Cannot withdraw after tournament fixtures have already started.");
  }

  const existing = db
    .prepare(
      `SELECT id, status FROM tournament_registrations WHERE tournament_id = ? AND user_id = ?`
    )
    .get(tournament.id, user.id) as { id: string; status: string } | undefined;

  if (!existing || existing.status === "WITHDRAWN") {
    throw new Error("You are not currently registered in this tournament.");
  }

  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE tournament_registrations SET status = 'WITHDRAWN', withdrawn_at = ? WHERE id = ?`
    ).run(now, existing.id);

    // If the withdrawing player held a CONFIRMED slot, promote the earliest WAITLISTED player
    if (existing.status === "CONFIRMED") {
      const nextWaitlisted = db
        .prepare(`
          SELECT id, user_id FROM tournament_registrations
          WHERE tournament_id = ? AND status = 'WAITLISTED'
          ORDER BY registered_at ASC LIMIT 1
        `)
        .get(tournament.id) as { id: string; user_id: string } | undefined;

      if (nextWaitlisted) {
        db.prepare(`UPDATE tournament_registrations SET status = 'CONFIRMED' WHERE id = ?`).run(
          nextWaitlisted.id
        );
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
          VALUES (?, ?, 'TOURNAMENT_REGISTRATION', ?, ?, ?, ?)
        `).run(
          createId("ntf"),
          nextWaitlisted.user_id,
          `Promoted from Waitlist: ${tournament.title}`,
          `A slot opened up in ${tournament.title} and your registration is now CONFIRMED!`,
          `/tournaments/${tournament.slug}`,
          now
        );
      }
    }

    writeAuditLog({
      actorId: user.id,
      action: "TOURNAMENT_WITHDRAWN",
      entityType: "TOURNAMENT",
      entityId: tournament.id,
    });

    db.exec("COMMIT");
    return { status: "WITHDRAWN" };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Generate automated brackets/groups/fixtures and transition tournament to IN_PROGRESS.
 */
export function generateTournamentBracketAndStart(
  tournamentIdOrSlug: string,
  actor: AuthenticatedUser
) {
  const db = getDb();
  const tournament = getTournamentBySlugOrId(tournamentIdOrSlug);
  if (!tournament) throw new Error("Tournament not found.");

  const isAuthorised =
    tournament.organiserId === actor.id ||
    hasAnyRole(actor, ["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);
  if (!isAuthorised) {
    throw new Error("Only the tournament organiser or a Tournament Admin may generate brackets.");
  }

  if (tournament.participants.length < 2) {
    throw new Error("At least 2 confirmed participants are required to generate brackets.");
  }

  const rawParticipants: BracketParticipant[] = tournament.participants.map((p) => ({
    userId: p.userId,
    username: p.username,
    rating: p.rating,
  }));

  const generated = generateTournamentFixturesAndBrackets(
    tournament.id,
    tournament.format,
    rawParticipants,
    tournament.seedingMode,
    tournament.startDate
  );

  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    // Clear any previous draft brackets/matches for this tournament if regenerating before results
    db.prepare(`DELETE FROM tournament_matches WHERE tournament_id = ?`).run(tournament.id);
    db.prepare(`DELETE FROM tournament_participants WHERE tournament_id = ?`).run(tournament.id);
    db.prepare(`DELETE FROM tournament_groups WHERE tournament_id = ?`).run(tournament.id);
    db.prepare(`DELETE FROM tournament_brackets WHERE tournament_id = ?`).run(tournament.id);

    // Insert groups if any
    const insertGroup = db.prepare(`
      INSERT INTO tournament_groups (id, tournament_id, name, order_index)
      VALUES (?, ?, ?, ?)
    `);
    const userGroupMap = new Map<string, string>();
    for (const grp of generated.groups) {
      insertGroup.run(grp.id, tournament.id, grp.name, grp.orderIndex);
      for (const uid of grp.participantIds) {
        userGroupMap.set(uid, grp.id);
      }
    }

    // Insert seeded participants
    const insertPart = db.prepare(`
      INSERT INTO tournament_participants (id, tournament_id, user_id, seed, group_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const incrTourneysPlayed = db.prepare(`
      UPDATE player_ratings SET tournaments_played = tournaments_played + 1, updated_at = ?
      WHERE user_id = ?
    `);
    for (const sp of generated.seededParticipants) {
      insertPart.run(
        createId("tpart"),
        tournament.id,
        sp.userId,
        sp.seed,
        userGroupMap.get(sp.userId) ?? null
      );
      incrTourneysPlayed.run(now, sp.userId);
    }

    // Insert matches
    const insertMatch = db.prepare(`
      INSERT INTO tournament_matches (
        id, tournament_id, group_id, round_number, round_label, match_number, bracket_side,
        player_one_id, player_two_id, player_one_score, player_two_score, winner_id,
        next_match_id, next_match_slot, status, scheduled_at, reporting_deadline,
        verified_at, rating_processed, is_friendly, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
      VALUES (?, ?, 'UPCOMING_MATCH', ?, ?, ?, ?)
    `);

    for (const m of generated.matches) {
      const deadline = new Date(new Date(m.scheduledAt).getTime() + 3600 * 1000 * 2).toISOString();
      const isByeCompleted = m.status === "COMPLETED";
      insertMatch.run(
        m.id,
        tournament.id,
        m.groupId ?? null,
        m.roundNumber,
        m.roundLabel,
        m.matchNumber,
        m.bracketSide,
        m.playerOneId,
        m.playerTwoId,
        m.playerOneScore,
        m.playerTwoScore,
        m.winnerId,
        m.nextMatchId,
        m.nextMatchSlot,
        m.status,
        m.scheduledAt,
        deadline,
        isByeCompleted ? now : null,
        isByeCompleted ? 1 : 0,
        now,
        now
      );

      if (m.playerOneId && m.playerTwoId) {
        insertNotification.run(
          createId("ntf"),
          m.playerOneId,
          `Fixture Ready: ${tournament.title} (${m.roundLabel})`,
          `Your match room is open. Check in, play your fixture in eFootball, and submit your verified score.`,
          `/matches/${m.id}`,
          now
        );
        insertNotification.run(
          createId("ntf"),
          m.playerTwoId,
          `Fixture Ready: ${tournament.title} (${m.roundLabel})`,
          `Your match room is open. Check in, play your fixture in eFootball, and submit your verified score.`,
          `/matches/${m.id}`,
          now
        );
      }
    }

    db.prepare(`
      INSERT INTO tournament_brackets (id, tournament_id, bracket_type, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      createId("brk"),
      tournament.id,
      tournament.format,
      JSON.stringify({
        seedingMode: tournament.seedingMode,
        participantCount: generated.seededParticipants.length,
        matchCount: generated.matches.length,
      }),
      now
    );

    db.prepare(`UPDATE tournaments SET status = 'IN_PROGRESS', updated_at = ? WHERE id = ?`).run(
      now,
      tournament.id
    );

    writeAuditLog({
      actorId: actor.id,
      action: "BRACKET_GENERATED",
      entityType: "TOURNAMENT",
      entityId: tournament.id,
      details: `Generated ${generated.matches.length} fixtures (${tournament.format})`,
    });

    db.exec("COMMIT");
    return getTournamentBySlugOrId(tournament.id)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Retrieve complete Match Room details (`/matches/[matchId]`).
 * Enforces Section 11 privacy rules for evidence uploads!
 */
export function getMatchDetail(matchId: string, viewer?: AuthenticatedUser | null) {
  const db = getDb();
  const m = db
    .prepare(`
      SELECT
        m.*,
        t.title as tournament_title,
        t.slug as tournament_slug,
        t.format as tournament_format,
        t.platform as tournament_platform,
        t.organiser_id as tournament_organiser_id,
        u1.username as player_one_username,
        p1.display_name as player_one_display_name,
        p1.county as player_one_county,
        p1.efootball_id as player_one_efootball_id,
        r1.rating as player_one_rating,
        u2.username as player_two_username,
        p2.display_name as player_two_display_name,
        p2.county as player_two_county,
        p2.efootball_id as player_two_efootball_id,
        r2.rating as player_two_rating,
        uw.username as winner_username
      FROM tournament_matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users u1 ON u1.id = m.player_one_id
      LEFT JOIN profiles p1 ON p1.user_id = m.player_one_id
      LEFT JOIN player_ratings r1 ON r1.user_id = m.player_one_id
      LEFT JOIN users u2 ON u2.id = m.player_two_id
      LEFT JOIN profiles p2 ON p2.user_id = m.player_two_id
      LEFT JOIN player_ratings r2 ON r2.user_id = m.player_two_id
      LEFT JOIN users uw ON uw.id = m.winner_id
      WHERE m.id = ?
    `)
    .get(matchId) as any;

  if (!m) return null;

  const checkins = db
    .prepare(`SELECT user_id, checked_in_at FROM match_checkins WHERE match_id = ?`)
    .all(matchId) as Array<{ user_id: string; checked_in_at: string }>;

  const results = db
    .prepare(`
      SELECT mr.*, u.username as submitted_by_username
      FROM match_results mr
      JOIN users u ON u.id = mr.submitted_by_id
      WHERE mr.match_id = ?
      ORDER BY mr.submitted_at ASC
    `)
    .all(matchId) as any[];

  // Section 11 Privacy Rule: Evidence is private and accessible only to match participants, organiser, and moderators/admins!
  const canViewPrivateEvidence =
    viewer &&
    (viewer.id === m.player_one_id ||
      viewer.id === m.player_two_id ||
      viewer.id === m.tournament_organiser_id ||
      hasAnyRole(viewer, ["MODERATOR", "TOURNAMENT_ADMIN", "SUPER_ADMIN"]));

  const evidenceRows = canViewPrivateEvidence
    ? (db
        .prepare(`
          SELECT me.*, u.username as uploaded_by_username
          FROM match_evidence me
          JOIN users u ON u.id = me.uploaded_by_id
          WHERE me.match_id = ?
          ORDER BY me.uploaded_at DESC
        `)
        .all(matchId) as any[])
    : [];

  const disputes = db
    .prepare(`
      SELECT d.*, u.username as opened_by_username
      FROM disputes d
      JOIN users u ON u.id = d.opened_by_id
      WHERE d.match_id = ?
      ORDER BY d.created_at DESC
    `)
    .all(matchId) as any[];

  const rules = m.tournament_id
    ? (db
        .prepare(`SELECT * FROM tournament_rules WHERE tournament_id = ?`)
        .get(m.tournament_id) as any)
    : null;

  return {
    id: m.id,
    tournamentId: m.tournament_id,
    tournamentTitle: m.tournament_title || "Friendly Match Challenge",
    tournamentSlug: m.tournament_slug,
    tournamentFormat: m.tournament_format || "FRIENDLY",
    tournamentPlatform: m.tournament_platform || "MOBILE",
    tournamentOrganiserId: m.tournament_organiser_id,
    roundNumber: Number(m.round_number),
    roundLabel: m.round_label,
    matchNumber: Number(m.match_number),
    bracketSide: m.bracket_side,
    playerOne: m.player_one_id
      ? {
          id: m.player_one_id,
          username: m.player_one_username,
          displayName: m.player_one_display_name || m.player_one_username,
          county: m.player_one_county || "Nairobi",
          efootballId: m.player_one_efootball_id,
          rating: Number(m.player_one_rating ?? 1200),
          checkedIn: checkins.some((c) => c.user_id === m.player_one_id),
        }
      : null,
    playerTwo: m.player_two_id
      ? {
          id: m.player_two_id,
          username: m.player_two_username,
          displayName: m.player_two_display_name || m.player_two_username,
          county: m.player_two_county || "Nairobi",
          efootballId: m.player_two_efootball_id,
          rating: Number(m.player_two_rating ?? 1200),
          checkedIn: checkins.some((c) => c.user_id === m.player_two_id),
        }
      : null,
    playerOneScore: m.player_one_score !== null ? Number(m.player_one_score) : null,
    playerTwoScore: m.player_two_score !== null ? Number(m.player_two_score) : null,
    winnerId: m.winner_id,
    winnerUsername: m.winner_username,
    nextMatchId: m.next_match_id,
    nextMatchSlot: m.next_match_slot ? Number(m.next_match_slot) : null,
    status: m.status,
    scheduledAt: m.scheduled_at,
    reportingDeadline: m.reporting_deadline,
    verifiedAt: m.verified_at,
    ratingProcessed: Boolean(m.rating_processed),
    isFriendly: Boolean(m.is_friendly),
    rulesContent:
      rules?.rules_content ||
      "Standard 10-minute eFootball match. Submit accurate full-time scores and keep screenshot proof.",
    submissions: results.map((r) => ({
      id: r.id,
      submittedById: r.submitted_by_id,
      submittedByUsername: r.submitted_by_username,
      playerOneScore: Number(r.player_one_score),
      playerTwoScore: Number(r.player_two_score),
      notes: r.notes,
      status: r.status,
      submittedAt: r.submitted_at,
    })),
    canViewPrivateEvidence: Boolean(canViewPrivateEvidence),
    evidence: evidenceRows.map((e) => ({
      id: e.id,
      uploadedById: e.uploaded_by_id,
      uploadedByUsername: e.uploaded_by_username,
      fileType: e.file_type,
      mimeType: e.mime_type,
      fileSize: Number(e.file_size),
      storagePath: e.storage_path,
      caption: e.caption,
      isPrivate: Boolean(e.is_private),
      uploadedAt: e.uploaded_at,
    })),
    disputes: disputes.map((d) => ({
      id: d.id,
      openedById: d.opened_by_id,
      openedByUsername: d.opened_by_username,
      category: d.category,
      description: d.description,
      status: d.status,
      createdAt: d.created_at,
      resolvedAt: d.resolved_at,
    })),
  };
}

/**
 * Player Check-in for a scheduled match (Section 11 No-Show Handling)
 */
export function checkInToMatch(matchId: string, user: AuthenticatedUser) {
  const db = getDb();
  const match = getMatchDetail(matchId, user);
  if (!match) throw new Error("Match not found.");

  if (match.playerOne?.id !== user.id && match.playerTwo?.id !== user.id) {
    throw new Error("Only the two assigned match participants can check in.");
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO match_checkins (id, match_id, user_id, checked_in_at)
    VALUES (?, ?, ?, ?)
  `).run(createId("chk"), matchId, user.id, now);

  const checkinCount = db
    .prepare(`SELECT COUNT(*) as cnt FROM match_checkins WHERE match_id = ?`)
    .get(matchId) as { cnt: number };

  if (Number(checkinCount.cnt) >= 2 && (match.status === "SCHEDULED" || match.status === "READY")) {
    db.prepare(`UPDATE tournament_matches SET status = 'IN_PROGRESS', updated_at = ? WHERE id = ?`).run(
      now,
      matchId
    );
  }

  return getMatchDetail(matchId, user)!;
}

/**
 * Upload Private Match Evidence (Screenshots / Video references)
 * Section 11: Validate file types, sizes, ownership, and store privately.
 */
export function uploadMatchEvidence(params: {
  matchId: string;
  user: AuthenticatedUser;
  fileType: "IMAGE" | "VIDEO";
  mimeType: string;
  fileSize: number;
  storagePath: string;
  caption?: string;
}) {
  const db = getDb();
  const match = getMatchDetail(params.matchId, params.user);
  if (!match) throw new Error("Match not found.");

  const isParticipant =
    match.playerOne?.id === params.user.id || match.playerTwo?.id === params.user.id;
  const isMod = hasAnyRole(params.user, ["MODERATOR", "TOURNAMENT_ADMIN", "SUPER_ADMIN"]);
  if (!isParticipant && !isMod) {
    throw new Error("Unauthorised: Only match participants or moderators may upload match evidence.");
  }

  const allowedMime = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "video/webm",
  ];
  if (!allowedMime.includes(params.mimeType)) {
    throw new Error("Invalid file type. Allowed formats: PNG, JPEG, WEBP, MP4, WEBM.");
  }

  const maxBytes = params.fileType === "VIDEO" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (params.fileSize <= 0 || params.fileSize > maxBytes) {
    throw new Error(`File size exceeds maximum limit (${params.fileType === "VIDEO" ? "50MB" : "10MB"}).`);
  }

  const now = new Date().toISOString();
  const id = createId("evd");
  db.prepare(`
    INSERT INTO match_evidence (
      id, match_id, uploaded_by_id, file_type, mime_type, file_size, storage_path, caption, is_private, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    params.matchId,
    params.user.id,
    params.fileType,
    params.mimeType,
    params.fileSize,
    params.storagePath,
    params.caption || null,
    now
  );

  writeAuditLog({
    actorId: params.user.id,
    action: "MATCH_EVIDENCE_UPLOADED",
    entityType: "MATCH",
    entityId: params.matchId,
    details: `Uploaded private ${params.fileType} (${params.mimeType})`,
  });

  return getMatchDetail(params.matchId, params.user)!;
}

/**
 * Submit Match Result (Section 11 Result Submission Workflow Steps 5–10):
 * - Each player submits the final score.
 * - When the first player submits, status becomes AWAITING_CONFIRMATION and opponent is notified.
 * - When the second player submits:
 *   - If scores match -> Result is CONFIRMED, Elo ratings & achievements update, and bracket advances!
 *   - If scores conflict -> Match status becomes DISPUTED and a formal Dispute record is opened automatically!
 */
export function submitMatchResult(params: {
  matchId: string;
  user: AuthenticatedUser;
  playerOneScore: number;
  playerTwoScore: number;
  notes?: string;
  evidenceCaption?: string;
  evidenceDataUrl?: string;
}) {
  const db = getDb();
  const match = getMatchDetail(params.matchId, params.user);
  if (!match) throw new Error("Match not found.");

  if (!match.playerOne || !match.playerTwo) {
    throw new Error("Both players must be assigned before results can be reported.");
  }

  const isPlayerOne = match.playerOne.id === params.user.id;
  const isPlayerTwo = match.playerTwo.id === params.user.id;
  if (!isPlayerOne && !isPlayerTwo) {
    throw new Error("Only the two match participants can submit scores for this fixture.");
  }

  if (match.status === "COMPLETED" || match.status === "WALKOVER" || match.status === "CANCELLED") {
    throw new Error(`Match is already finalised (${match.status}).`);
  }

  if (match.status === "DISPUTED") {
    throw new Error("This match is currently under Moderator Dispute Review.");
  }

  const p1Score = Math.floor(Number(params.playerOneScore));
  const p2Score = Math.floor(Number(params.playerTwoScore));
  if (isNaN(p1Score) || isNaN(p2Score) || p1Score < 0 || p2Score < 0 || p1Score > 30 || p2Score > 30) {
    throw new Error("Scores must be valid non-negative integers between 0 and 30.");
  }

  // Knockout matches cannot end in a draw
  const isKnockout =
    match.bracketSide === "WINNERS" ||
    match.bracketSide === "LOSERS" ||
    match.bracketSide === "GRAND_FINAL";
  if (!match.isFriendly && isKnockout && p1Score === p2Score) {
    throw new Error(
      "Knockout bracket matches cannot end in a draw. Please report the final score after Extra Time / Penalties."
    );
  }

  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    // Save optional screenshot evidence privately if attached
    if (params.evidenceDataUrl) {
      db.prepare(`
        INSERT INTO match_evidence (
          id, match_id, uploaded_by_id, file_type, mime_type, file_size, storage_path, caption, is_private, uploaded_at
        ) VALUES (?, ?, ?, 'IMAGE', 'image/png', ?, ?, ?, 1, ?)
      `).run(
        createId("evd"),
        match.id,
        params.user.id,
        params.evidenceDataUrl.length,
        params.evidenceDataUrl,
        params.evidenceCaption || "Full-time scoreboard proof",
        now
      );
    }

    // Upsert this player's submission
    const existingSub = db
      .prepare(`SELECT id FROM match_results WHERE match_id = ? AND submitted_by_id = ?`)
      .get(match.id, params.user.id) as { id: string } | undefined;

    if (existingSub) {
      db.prepare(`
        UPDATE match_results
        SET player_one_score = ?, player_two_score = ?, notes = ?, status = 'SUBMITTED', submitted_at = ?
        WHERE id = ?
      `).run(p1Score, p2Score, params.notes || null, now, existingSub.id);
    } else {
      db.prepare(`
        INSERT INTO match_results (
          id, match_id, submitted_by_id, player_one_score, player_two_score, notes, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
      `).run(
        createId("mres"),
        match.id,
        params.user.id,
        p1Score,
        p2Score,
        params.notes || null,
        now
      );
    }

    // Check if opponent has also submitted
    const opponentId = isPlayerOne ? match.playerTwo.id : match.playerOne.id;
    const opponentSub = db
      .prepare(
        `SELECT id, player_one_score, player_two_score FROM match_results WHERE match_id = ? AND submitted_by_id = ?`
      )
      .get(match.id, opponentId) as
      | { id: string; player_one_score: number; player_two_score: number }
      | undefined;

    if (!opponentSub) {
      // Waiting for second player confirmation
      db.prepare(`
        UPDATE tournament_matches
        SET status = 'AWAITING_CONFIRMATION', updated_at = ?
        WHERE id = ?
      `).run(now, match.id);

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
        VALUES (?, ?, 'RESULT_CONFIRMED', ?, ?, ?, ?)
      `).run(
        createId("ntf"),
        opponentId,
        `Score Reported in ${match.tournamentTitle}`,
        `${params.user.username} reported ${match.playerOne.username} ${p1Score} - ${p2Score} ${match.playerTwo.username}. Open the match room to confirm or dispute.`,
        `/matches/${match.id}`,
        now
      );
    } else if (
      Number(opponentSub.player_one_score) === p1Score &&
      Number(opponentSub.player_two_score) === p2Score
    ) {
      // Scores match! Confirm result, update Elo, and advance bracket!
      db.prepare(`UPDATE match_results SET status = 'CONFIRMED' WHERE match_id = ?`).run(match.id);
      finalizeVerifiedMatchInternal(db, match.id, p1Score, p2Score, "COMPLETED", params.user.id);
    } else {
      // Scores conflict! Automatically create a Dispute and freeze match advancement!
      db.prepare(`UPDATE match_results SET status = 'CONFLICTED' WHERE match_id = ?`).run(match.id);
      db.prepare(`UPDATE tournament_matches SET status = 'DISPUTED', updated_at = ? WHERE id = ?`).run(
        now,
        match.id
      );

      const disputeId = createId("dsp");
      db.prepare(`
        INSERT INTO disputes (
          id, match_id, opened_by_id, category, description, status, created_at
        ) VALUES (?, ?, ?, 'CONFLICTING_SCORES', ?, 'OPEN', ?)
      `).run(
        disputeId,
        match.id,
        params.user.id,
        `Automated conflict detected: ${params.user.username} reported ${p1Score}-${p2Score}, while opponent reported ${opponentSub.player_one_score}-${opponentSub.player_two_score}.`,
        now
      );

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
        VALUES (?, ?, 'DISPUTE_UPDATE', ?, ?, ?, ?)
      `).run(
        createId("ntf"),
        match.playerOne.id,
        `Conflicting Score Dispute Opened`,
        `Conflicting scores were submitted in ${match.roundLabel}. Please upload scoreboard proof in the Match Room for Moderator review.`,
        `/matches/${match.id}`,
        now
      );
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
        VALUES (?, ?, 'DISPUTE_UPDATE', ?, ?, ?, ?)
      `).run(
        createId("ntf"),
        match.playerTwo.id,
        `Conflicting Score Dispute Opened`,
        `Conflicting scores were submitted in ${match.roundLabel}. Please upload scoreboard proof in the Match Room for Moderator review.`,
        `/matches/${match.id}`,
        now
      );

      writeAuditLog({
        actorId: params.user.id,
        action: "MATCH_SCORE_CONFLICT_DISPUTE",
        entityType: "MATCH",
        entityId: match.id,
        details: `Conflicting scores: ${p1Score}-${p2Score} vs ${opponentSub.player_one_score}-${opponentSub.player_two_score}`,
      });
    }

    db.exec("COMMIT");
    return getMatchDetail(match.id, params.user)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Internal transactional helper that finalises a verified match:
 * 1. Sets verified score, winnerId, status, and verifiedAt.
 * 2. Updates Elo ratings and player statistics (if not friendly and not already processed).
 * 3. Evaluates and awards earned player achievements.
 * 4. Advances winner to nextMatchId in knockout brackets (enforcing `canAdvanceBracketMatch`).
 * 5. Marks tournament COMPLETED if this was the final match.
 */
export function finalizeVerifiedMatchInternal(
  db: any,
  matchId: string,
  p1Score: number,
  p2Score: number,
  finalStatus: "COMPLETED" | "WALKOVER",
  actorId: string
) {
  const now = new Date().toISOString();
  const m = db
    .prepare(`SELECT * FROM tournament_matches WHERE id = ?`)
    .get(matchId) as any;

  if (!m || !m.player_one_id || !m.player_two_id) {
    throw new Error("Match participants missing for verification.");
  }

  let winnerId: string | null = null;
  if (p1Score > p2Score) winnerId = m.player_one_id;
  else if (p2Score > p1Score) winnerId = m.player_two_id;

  db.prepare(`
    UPDATE tournament_matches
    SET player_one_score = ?, player_two_score = ?, winner_id = ?, status = ?, verified_at = ?, updated_at = ?
    WHERE id = ?
  `).run(p1Score, p2Score, winnerId, finalStatus, now, now, matchId);

  // Process Elo & player stats if eligible
  const r1 = db
    .prepare(`SELECT * FROM player_ratings WHERE user_id = ?`)
    .get(m.player_one_id) as any;
  const r2 = db
    .prepare(`SELECT * FROM player_ratings WHERE user_id = ?`)
    .get(m.player_two_id) as any;

  const p1OldRating = Number(r1?.rating ?? 1200);
  const p2OldRating = Number(r2?.rating ?? 1200);

  const eloResult = computeMatchEloUpdate({
    playerOneRating: p1OldRating,
    playerTwoRating: p2OldRating,
    playerOneScore: p1Score,
    playerTwoScore: p2Score,
    kFactor: 32,
    isFriendly: Boolean(m.is_friendly),
    isVerified: true,
    alreadyProcessed: Boolean(m.rating_processed),
  });

  if (eloResult.eligible) {
    // Update Player 1 stats
    const p1Win = p1Score > p2Score ? 1 : 0;
    const p1Draw = p1Score === p2Score ? 1 : 0;
    const p1Loss = p1Score < p2Score ? 1 : 0;
    const p1Streak = p1Win ? Number(r1?.current_streak ?? 0) + 1 : 0;
    const p1BestStreak = Math.max(Number(r1?.best_streak ?? 0), p1Streak);
    const p1Peak = Math.max(Number(r1?.peak_rating ?? 1200), eloResult.playerOneNewRating);

    db.prepare(`
      UPDATE player_ratings
      SET rating = ?, peak_rating = ?, last_rating_change = ?,
          matches_played = matches_played + 1,
          wins = wins + ?, draws = draws + ?, losses = losses + ?,
          goals_scored = goals_scored + ?, goals_conceded = goals_conceded + ?,
          current_streak = ?, best_streak = ?, updated_at = ?
      WHERE user_id = ?
    `).run(
      eloResult.playerOneNewRating,
      p1Peak,
      eloResult.playerOneDelta,
      p1Win,
      p1Draw,
      p1Loss,
      p1Score,
      p2Score,
      p1Streak,
      p1BestStreak,
      now,
      m.player_one_id
    );

    // Update Player 2 stats
    const p2Win = p2Score > p1Score ? 1 : 0;
    const p2Draw = p1Score === p2Score ? 1 : 0;
    const p2Loss = p2Score < p1Score ? 1 : 0;
    const p2Streak = p2Win ? Number(r2?.current_streak ?? 0) + 1 : 0;
    const p2BestStreak = Math.max(Number(r2?.best_streak ?? 0), p2Streak);
    const p2Peak = Math.max(Number(r2?.peak_rating ?? 1200), eloResult.playerTwoNewRating);

    db.prepare(`
      UPDATE player_ratings
      SET rating = ?, peak_rating = ?, last_rating_change = ?,
          matches_played = matches_played + 1,
          wins = wins + ?, draws = draws + ?, losses = losses + ?,
          goals_scored = goals_scored + ?, goals_conceded = goals_conceded + ?,
          current_streak = ?, best_streak = ?, updated_at = ?
      WHERE user_id = ?
    `).run(
      eloResult.playerTwoNewRating,
      p2Peak,
      eloResult.playerTwoDelta,
      p2Win,
      p2Draw,
      p2Loss,
      p2Score,
      p1Score,
      p2Streak,
      p2BestStreak,
      now,
      m.player_two_id
    );

    // Record Rating Events
    const insertRatingEvent = db.prepare(`
      INSERT OR IGNORE INTO rating_events (
        id, user_id, match_id, season_id, old_rating, new_rating, rating_delta,
        k_factor, expected_score, actual_score, created_at
      ) VALUES (?, ?, ?, 'season_2026_s1', ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRatingEvent.run(
      createId("rev"),
      m.player_one_id,
      matchId,
      eloResult.playerOneOldRating,
      eloResult.playerOneNewRating,
      eloResult.playerOneDelta,
      eloResult.kFactor,
      eloResult.playerOneExpected,
      eloResult.playerOneActual,
      now
    );
    insertRatingEvent.run(
      createId("rev"),
      m.player_two_id,
      matchId,
      eloResult.playerTwoOldRating,
      eloResult.playerTwoNewRating,
      eloResult.playerTwoDelta,
      eloResult.kFactor,
      eloResult.playerTwoExpected,
      eloResult.playerTwoActual,
      now
    );

    db.prepare(`UPDATE tournament_matches SET rating_processed = 1 WHERE id = ?`).run(matchId);
  }

  // Advance Winner in Knockout Bracket if applicable
  if (m.next_match_id && winnerId) {
    const check = canAdvanceBracketMatch({
      status: finalStatus,
      winnerId,
      playerOneScore: p1Score,
      playerTwoScore: p2Score,
      verifiedAt: now,
    });
    if (check.allowed) {
      const slotCol = Number(m.next_match_slot) === 2 ? "player_two_id" : "player_one_id";
      db.prepare(`UPDATE tournament_matches SET ${slotCol} = ?, updated_at = ? WHERE id = ?`).run(
        winnerId,
        now,
        m.next_match_id
      );

      const nextM = db
        .prepare(`SELECT player_one_id, player_two_id, status FROM tournament_matches WHERE id = ?`)
        .get(m.next_match_id) as any;

      if (nextM && nextM.player_one_id && nextM.player_two_id && nextM.status === "SCHEDULED") {
        db.prepare(`UPDATE tournament_matches SET status = 'READY', updated_at = ? WHERE id = ?`).run(
          now,
          m.next_match_id
        );
      }
    }
  }

  // Check if this match completed the entire tournament
  if (m.tournament_id) {
    const remaining = db
      .prepare(`
        SELECT COUNT(*) as cnt FROM tournament_matches
        WHERE tournament_id = ? AND status NOT IN ('COMPLETED', 'WALKOVER', 'CANCELLED')
      `)
      .get(m.tournament_id) as { cnt: number };

    if (Number(remaining.cnt) === 0) {
      // Determine champion
      let championId = winnerId;
      const tRow = db
        .prepare(`SELECT format, title, slug FROM tournaments WHERE id = ?`)
        .get(m.tournament_id) as { format: string; title: string; slug: string };

      if (tRow.format === "ROUND_ROBIN" || tRow.format === "LEAGUE_SEASON") {
        const tFull = getTournamentBySlugOrId(m.tournament_id);
        if (tFull && tFull.standings.length > 0) {
          championId = tFull.standings[0].userId;
        }
      }

      db.prepare(`
        UPDATE tournaments SET status = 'COMPLETED', winner_id = ?, updated_at = ? WHERE id = ?
      `).run(championId, now, m.tournament_id);

      if (championId) {
        db.prepare(`
          UPDATE player_ratings SET tournaments_won = tournaments_won + 1, updated_at = ? WHERE user_id = ?
        `).run(now, championId);

        const champUser = db
          .prepare(`SELECT username FROM users WHERE id = ?`)
          .get(championId) as { username: string } | undefined;

        db.prepare(`
          INSERT INTO activity_events (id, actor_id, event_type, title, body, link_url, created_at)
          VALUES (?, ?, 'NEW_CHAMPION', ?, ?, ?, ?)
        `).run(
          createId("act"),
          championId,
          `Tournament Champion Crowned: ${champUser?.username || "Champion"}`,
          `${champUser?.username || "A player"} has won ${tRow.title}!`,
          `/tournaments/${tRow.slug}`,
          now
        );
      }
    }
  }

  // Evaluate and award achievements for both players
  awardAchievementsForUserInternal(db, m.player_one_id, matchId);
  awardAchievementsForUserInternal(db, m.player_two_id, matchId);

  writeAuditLog({
    actorId,
    action: `MATCH_${finalStatus}`,
    entityType: "MATCH",
    entityId: matchId,
    details: `Score confirmed: ${p1Score}-${p2Score} (Winner: ${winnerId || "Draw"})`,
  });
}

function awardAchievementsForUserInternal(db: any, userId: string, sourceId: string) {
  const r = db.prepare(`SELECT * FROM player_ratings WHERE user_id = ?`).get(userId) as any;
  if (!r) return;

  const existingRows = db
    .prepare(`SELECT code FROM player_achievements WHERE user_id = ?`)
    .all(userId) as Array<{ code: string }>;

  const unlockedCodes = evaluateUnlockedAchievements({
    rating: Number(r.rating),
    wins: Number(r.wins),
    draws: Number(r.draws),
    losses: Number(r.losses),
    matchesPlayed: Number(r.matches_played),
    currentStreak: Number(r.current_streak),
    bestStreak: Number(r.best_streak),
    tournamentsWon: Number(r.tournaments_won),
    existingAchievementCodes: existingRows.map((x) => x.code),
  });

  const now = new Date().toISOString();
  for (const code of unlockedCodes) {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === code);
    if (!def) continue;
    db.prepare(`
      INSERT OR IGNORE INTO player_achievements (id, user_id, code, title, description, tier, awarded_at, source_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(createId("ach"), userId, def.code, def.title, def.description, def.tier, now, sourceId);

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
      VALUES (?, ?, 'ANNOUNCEMENT', ?, ?, '/dashboard/achievements', ?)
    `).run(
      createId("ntf"),
      userId,
      `Achievement Unlocked: ${def.title}`,
      def.description,
      now
    );
  }
}

/**
 * Open a manual Dispute on a match (Section 12)
 */
export function openMatchDispute(params: {
  matchId: string;
  user: AuthenticatedUser;
  category: string;
  description: string;
  evidenceStoragePath?: string;
}) {
  const db = getDb();
  const match = getMatchDetail(params.matchId, params.user);
  if (!match) throw new Error("Match not found.");

  if (match.playerOne?.id !== params.user.id && match.playerTwo?.id !== params.user.id) {
    throw new Error("Only the participants of this match can open a dispute.");
  }

  if (!params.description.trim()) {
    throw new Error("Please provide a detailed description of the dispute.");
  }

  const now = new Date().toISOString();
  const disputeId = createId("dsp");

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO disputes (id, match_id, opened_by_id, category, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(disputeId, match.id, params.user.id, params.category, params.description.trim(), now);

    if (params.evidenceStoragePath) {
      db.prepare(`
        INSERT INTO dispute_evidence (id, dispute_id, uploaded_by_id, file_type, storage_path, description, created_at)
        VALUES (?, ?, ?, 'IMAGE', ?, 'Dispute attachment', ?)
      `).run(createId("devd"), disputeId, params.user.id, params.evidenceStoragePath, now);
    }

    db.prepare(`UPDATE tournament_matches SET status = 'DISPUTED', updated_at = ? WHERE id = ?`).run(
      now,
      match.id
    );

    writeAuditLog({
      actorId: params.user.id,
      action: "DISPUTE_OPENED",
      entityType: "DISPUTE",
      entityId: disputeId,
      details: `Category: ${params.category} on Match ${match.id}`,
    });

    db.exec("COMMIT");
    return disputeId;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Resolve a Dispute by an Authorised Moderator (Section 12)
 * Enforces Conflict-of-Interest prevention: Moderator cannot rule on a match they played in!
 */
export function resolveDisputeByModerator(params: {
  disputeId: string;
  moderator: AuthenticatedUser;
  ruling: "CONFIRM_SCORE" | "ORDER_REMATCH" | "ISSUE_WALKOVER" | "APPLY_SANCTION" | "DISMISS";
  playerOneScore?: number;
  playerTwoScore?: number;
  reasoning: string;
}) {
  if (!hasAnyRole(params.moderator, ["MODERATOR", "TOURNAMENT_ADMIN", "SUPER_ADMIN"])) {
    throw new Error("Unauthorised: Moderator or Admin permissions required.");
  }

  const db = getDb();
  const dispute = db
    .prepare(`SELECT * FROM disputes WHERE id = ?`)
    .get(params.disputeId) as any;
  if (!dispute) throw new Error("Dispute not found.");

  const match = db
    .prepare(`SELECT * FROM tournament_matches WHERE id = ?`)
    .get(dispute.match_id) as any;
  if (!match) throw new Error("Associated match not found.");

  // Section 12 Conflict of Interest Guard
  if (
    match.player_one_id === params.moderator.id ||
    match.player_two_id === params.moderator.id
  ) {
    throw new Error(
      "Conflict of Interest Prevention: Moderators cannot adjudicate disputes in which they are a participant."
    );
  }

  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    let winnerId: string | null = null;
    if (
      params.ruling === "CONFIRM_SCORE" ||
      params.ruling === "ISSUE_WALKOVER"
    ) {
      const s1 = Number(params.playerOneScore ?? 0);
      const s2 = Number(params.playerTwoScore ?? 0);
      if (s1 > s2) winnerId = match.player_one_id;
      else if (s2 > s1) winnerId = match.player_two_id;

      finalizeVerifiedMatchInternal(
        db,
        match.id,
        s1,
        s2,
        params.ruling === "ISSUE_WALKOVER" ? "WALKOVER" : "COMPLETED",
        params.moderator.id
      );
    } else if (params.ruling === "ORDER_REMATCH") {
      db.prepare(`DELETE FROM match_results WHERE match_id = ?`).run(match.id);
      db.prepare(`
        UPDATE tournament_matches
        SET status = 'READY', player_one_score = NULL, player_two_score = NULL, winner_id = NULL, updated_at = ?
        WHERE id = ?
      `).run(now, match.id);
    }

    db.prepare(`
      INSERT INTO dispute_decisions (
        id, dispute_id, moderator_id, ruling, player_one_score, player_two_score, winner_id, reasoning, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      createId("ddec"),
      dispute.id,
      params.moderator.id,
      params.ruling,
      params.playerOneScore ?? null,
      params.playerTwoScore ?? null,
      winnerId,
      params.reasoning.trim(),
      now
    );

    db.prepare(`UPDATE disputes SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`).run(
      now,
      dispute.id
    );

    writeAuditLog({
      actorId: params.moderator.id,
      action: "DISPUTE_RESOLVED",
      entityType: "DISPUTE",
      entityId: dispute.id,
      details: `Ruling: ${params.ruling} — ${params.reasoning.trim()}`,
    });

    db.exec("COMMIT");
    return true;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Submit one Appeal on a resolved dispute (Section 12)
 */
export function submitDisputeAppeal(params: {
  disputeId: string;
  user: AuthenticatedUser;
  reason: string;
}) {
  const db = getDb();
  const dispute = db.prepare(`SELECT * FROM disputes WHERE id = ?`).get(params.disputeId) as any;
  if (!dispute) throw new Error("Dispute not found.");

  const existingAppeal = db
    .prepare(`SELECT id FROM dispute_appeals WHERE dispute_id = ?`)
    .get(params.disputeId);
  if (existingAppeal) {
    throw new Error("Only one appeal is permitted per dispute.");
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO dispute_appeals (id, dispute_id, appellant_id, reason, status, created_at)
    VALUES (?, ?, ?, ?, 'PENDING', ?)
  `).run(createId("appl"), params.disputeId, params.user.id, params.reason.trim(), now);

  db.prepare(`UPDATE disputes SET status = 'APPEALED' WHERE id = ?`).run(params.disputeId);

  writeAuditLog({
    actorId: params.user.id,
    action: "DISPUTE_APPEALED",
    entityType: "DISPUTE",
    entityId: params.disputeId,
    details: params.reason.trim(),
  });

  return true;
}

export function postTournamentAnnouncement(params: {
  tournamentId: string;
  author: AuthenticatedUser;
  title: string;
  content: string;
}) {
  const db = getDb();
  const t = getTournamentBySlugOrId(params.tournamentId);
  if (!t) throw new Error("Tournament not found.");

  if (
    t.organiserId !== params.author.id &&
    !hasAnyRole(params.author, ["TOURNAMENT_ADMIN", "SUPER_ADMIN"])
  ) {
    throw new Error("Only the tournament organiser or an admin can post announcements.");
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO tournament_announcements (id, tournament_id, author_id, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(createId("tann"), t.id, params.author.id, params.title.trim(), params.content.trim(), now);

  return true;
}
