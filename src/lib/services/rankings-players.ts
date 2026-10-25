// ============================================================================
// eFootball Kenya — Leaderboards, Player Profiles, Dashboard & Friendly Challenges
// Covers Sections 5, 7, 8, 13, 14, 16, 23
// ============================================================================

import { getDb, createId } from "@/lib/db";
import { AuthenticatedUser, writeAuditLog } from "@/lib/services/auth";

export function getPlatformStats() {
  const db = getDb();

  const registeredPlayers = (
    db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'ACTIVE'`).get() as { cnt: number }
  ).cnt;

  const tournamentsHosted = (
    db.prepare(`SELECT COUNT(*) as cnt FROM tournaments WHERE status != 'DRAFT' AND status != 'CANCELLED'`).get() as {
      cnt: number;
    }
  ).cnt;

  const completedTournaments = (
    db.prepare(`SELECT COUNT(*) as cnt FROM tournaments WHERE status = 'COMPLETED'`).get() as {
      cnt: number;
    }
  ).cnt;

  const matchesCompleted = (
    db.prepare(`SELECT COUNT(*) as cnt FROM tournament_matches WHERE status IN ('COMPLETED', 'WALKOVER')`).get() as {
      cnt: number;
    }
  ).cnt;

  const activeClans = (
    db.prepare(`SELECT COUNT(*) as cnt FROM clans`).get() as { cnt: number }
  ).cnt;

  return {
    registeredPlayers: Number(registeredPlayers),
    tournamentsHosted: Number(tournamentsHosted),
    completedTournaments: Number(completedTournaments),
    matchesCompleted: Number(matchesCompleted),
    activeClans: Number(activeClans),
  };
}

export function getLiveAndRecentMatches(limit = 6) {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        m.*,
        t.title as tournament_title,
        t.slug as tournament_slug,
        u1.username as player_one_username,
        p1.county as player_one_county,
        u2.username as player_two_username,
        p2.county as player_two_county
      FROM tournament_matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users u1 ON u1.id = m.player_one_id
      LEFT JOIN profiles p1 ON p1.user_id = m.player_one_id
      LEFT JOIN users u2 ON u2.id = m.player_two_id
      LEFT JOIN profiles p2 ON p2.user_id = m.player_two_id
      WHERE m.player_one_id IS NOT NULL AND m.player_two_id IS NOT NULL
      ORDER BY
        CASE m.status
          WHEN 'IN_PROGRESS' THEN 1
          WHEN 'AWAITING_CONFIRMATION' THEN 2
          WHEN 'READY' THEN 3
          WHEN 'COMPLETED' THEN 4
          ELSE 5
        END ASC,
        m.updated_at DESC
      LIMIT ?
    `)
    .all(limit) as any[];

  return rows.map((m) => ({
    id: m.id,
    tournamentTitle: m.tournament_title || "Friendly Challenge",
    tournamentSlug: m.tournament_slug,
    roundLabel: m.round_label,
    playerOneUsername: m.player_one_username,
    playerOneCounty: m.player_one_county || "Nairobi",
    playerTwoUsername: m.player_two_username,
    playerTwoCounty: m.player_two_county || "Nairobi",
    playerOneScore: m.player_one_score !== null ? Number(m.player_one_score) : null,
    playerTwoScore: m.player_two_score !== null ? Number(m.player_two_score) : null,
    status: m.status,
    isLive: m.status === "IN_PROGRESS",
    scheduledAt: m.scheduled_at,
  }));
}

export interface LeaderboardFilter {
  county?: string;
  platform?: string;
  universityOnly?: boolean;
  university?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function getLeaderboard(filter?: LeaderboardFilter) {
  const db = getDb();
  const conditions: string[] = ["u.status = 'ACTIVE'"];
  const params: any[] = [];

  if (filter?.county && filter.county !== "ALL") {
    conditions.push("p.county = ?");
    params.push(filter.county);
  }
  if (filter?.platform && filter.platform !== "ALL") {
    conditions.push("p.platform = ?");
    params.push(filter.platform);
  }
  if (filter?.universityOnly) {
    conditions.push("p.university IS NOT NULL AND p.university != ''");
  }
  if (filter?.university && filter.university !== "ALL") {
    conditions.push("p.university = ?");
    params.push(filter.university);
  }
  if (filter?.search?.trim()) {
    conditions.push("(u.username LIKE ? OR p.display_name LIKE ? OR p.county LIKE ?)");
    const q = `%${filter.search.trim()}%`;
    params.push(q, q, q);
  }

  const whereSql = `WHERE ${conditions.join(" AND ")}`;
  const limit = filter?.limit ?? 100;
  const offset = filter?.offset ?? 0;

  const rows = db
    .prepare(`
      SELECT
        u.id as user_id,
        u.username,
        p.display_name,
        p.county,
        p.platform,
        p.is_verified,
        p.university,
        c.name as clan_name,
        c.tag as clan_tag,
        c.slug as clan_slug,
        COALESCE(r.rating, 1200) as rating,
        COALESCE(r.peak_rating, 1200) as peak_rating,
        COALESCE(r.last_rating_change, 0) as last_rating_change,
        COALESCE(r.matches_played, 0) as matches_played,
        COALESCE(r.wins, 0) as wins,
        COALESCE(r.draws, 0) as draws,
        COALESCE(r.losses, 0) as losses,
        COALESCE(r.goals_scored, 0) as goals_scored,
        COALESCE(r.goals_conceded, 0) as goals_conceded,
        COALESCE(r.tournaments_won, 0) as tournaments_won,
        COALESCE(r.current_streak, 0) as current_streak
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN player_ratings r ON r.user_id = u.id
      LEFT JOIN clans c ON c.id = p.clan_id
      ${whereSql}
      ORDER BY COALESCE(r.rating, 1200) DESC, COALESCE(r.wins, 0) DESC, u.created_at ASC
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset) as any[];

  return rows.map((row, idx) => {
    const matches = Number(row.matches_played);
    const wins = Number(row.wins);
    const winPercentage = matches > 0 ? Math.round((wins / matches) * 100) : 0;
    return {
      position: offset + idx + 1,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name || row.username,
      county: row.county || "Nairobi",
      platform: row.platform || "MOBILE",
      isVerified: Boolean(row.is_verified),
      university: row.university,
      clanName: row.clan_name,
      clanTag: row.clan_tag,
      clanSlug: row.clan_slug,
      rating: Number(row.rating),
      peakRating: Number(row.peak_rating),
      lastRatingChange: Number(row.last_rating_change),
      matchesPlayed: matches,
      wins,
      draws: Number(row.draws),
      losses: Number(row.losses),
      goalsScored: Number(row.goals_scored),
      goalsConceded: Number(row.goals_conceded),
      winPercentage,
      tournamentsWon: Number(row.tournaments_won),
      currentStreak: Number(row.current_streak),
    };
  });
}

export function getPlayerRanks(userId: string, county: string): {
  nationalRank: number;
  countyRank: number;
} {
  const db = getDb();
  const allNational = db
    .prepare(`
      SELECT u.id FROM users u
      LEFT JOIN player_ratings r ON r.user_id = u.id
      WHERE u.status = 'ACTIVE'
      ORDER BY COALESCE(r.rating, 1200) DESC, COALESCE(r.wins, 0) DESC, u.created_at ASC
    `)
    .all() as Array<{ id: string }>;

  const allCounty = db
    .prepare(`
      SELECT u.id FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN player_ratings r ON r.user_id = u.id
      WHERE u.status = 'ACTIVE' AND p.county = ?
      ORDER BY COALESCE(r.rating, 1200) DESC, COALESCE(r.wins, 0) DESC, u.created_at ASC
    `)
    .all(county) as Array<{ id: string }>;

  const natIdx = allNational.findIndex((x) => x.id === userId);
  const cntIdx = allCounty.findIndex((x) => x.id === userId);

  return {
    nationalRank: natIdx >= 0 ? natIdx + 1 : 1,
    countyRank: cntIdx >= 0 ? cntIdx + 1 : 1,
  };
}

export function getPlayerProfileByUsername(username: string, viewerId?: string | null) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT
        u.id, u.username, u.status, u.created_at,
        p.display_name, p.county, p.platform, p.efootball_id, p.bio, p.avatar_url, p.is_verified, p.university, p.clan_id,
        c.name as clan_name, c.tag as clan_tag, c.slug as clan_slug,
        COALESCE(r.rating, 1200) as rating,
        COALESCE(r.peak_rating, 1200) as peak_rating,
        COALESCE(r.last_rating_change, 0) as last_rating_change,
        COALESCE(r.matches_played, 0) as matches_played,
        COALESCE(r.wins, 0) as wins,
        COALESCE(r.draws, 0) as draws,
        COALESCE(r.losses, 0) as losses,
        COALESCE(r.goals_scored, 0) as goals_scored,
        COALESCE(r.goals_conceded, 0) as goals_conceded,
        COALESCE(r.tournaments_played, 0) as tournaments_played,
        COALESCE(r.tournaments_won, 0) as tournaments_won,
        COALESCE(r.current_streak, 0) as current_streak,
        COALESCE(r.best_streak, 0) as best_streak
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN player_ratings r ON r.user_id = u.id
      LEFT JOIN clans c ON c.id = p.clan_id
      WHERE u.username = ? AND u.status != 'DELETED'
    `)
    .get(username) as any;

  if (!row) return null;

  const { nationalRank, countyRank } = getPlayerRanks(row.id, row.county || "Nairobi");
  const matchesPlayed = Number(row.matches_played);
  const wins = Number(row.wins);
  const winPercentage = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  const matchHistory = db
    .prepare(`
      SELECT
        m.*,
        t.title as tournament_title,
        t.slug as tournament_slug,
        u1.username as player_one_username,
        u2.username as player_two_username
      FROM tournament_matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users u1 ON u1.id = m.player_one_id
      LEFT JOIN users u2 ON u2.id = m.player_two_id
      WHERE (m.player_one_id = ? OR m.player_two_id = ?)
        AND m.player_one_id IS NOT NULL AND m.player_two_id IS NOT NULL
      ORDER BY m.scheduled_at DESC
      LIMIT 25
    `)
    .all(row.id, row.id) as any[];

  const tournaments = db
    .prepare(`
      SELECT
        t.id, t.slug, t.title, t.format, t.platform, t.status, t.start_date, t.winner_id,
        tr.status as registration_status
      FROM tournament_registrations tr
      JOIN tournaments t ON t.id = tr.tournament_id
      WHERE tr.user_id = ? AND tr.status != 'WITHDRAWN'
      ORDER BY t.start_date DESC
    `)
    .all(row.id) as any[];

  const achievements = db
    .prepare(`SELECT * FROM player_achievements WHERE user_id = ? ORDER BY awarded_at DESC`)
    .all(row.id) as any[];

  const ratingHistory = db
    .prepare(`SELECT * FROM rating_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`)
    .all(row.id) as any[];

  const followersCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM player_follows WHERE following_id = ?`)
      .get(row.id) as { cnt: number }
  ).cnt;

  const followingCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM player_follows WHERE follower_id = ?`)
      .get(row.id) as { cnt: number }
  ).cnt;

  const isFollowing = viewerId
    ? Boolean(
        db
          .prepare(`SELECT id FROM player_follows WHERE follower_id = ? AND following_id = ?`)
          .get(viewerId, row.id)
      )
    : false;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    county: row.county || "Nairobi",
    platform: row.platform || "MOBILE",
    efootballId: row.efootball_id,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isVerified: Boolean(row.is_verified),
    university: row.university,
    clanId: row.clan_id,
    clanName: row.clan_name,
    clanTag: row.clan_tag,
    clanSlug: row.clan_slug,
    joinedAt: row.created_at,
    nationalRank,
    countyRank,
    rating: Number(row.rating),
    peakRating: Number(row.peak_rating),
    lastRatingChange: Number(row.last_rating_change),
    matchesPlayed,
    wins,
    draws: Number(row.draws),
    losses: Number(row.losses),
    goalsScored: Number(row.goals_scored),
    goalsConceded: Number(row.goals_conceded),
    winPercentage,
    tournamentsEntered: tournaments.length,
    championshipsWon: Number(row.tournaments_won),
    currentStreak: Number(row.current_streak),
    bestStreak: Number(row.best_streak),
    followersCount: Number(followersCount),
    followingCount: Number(followingCount),
    isFollowing,
    matchHistory: matchHistory.map((m) => ({
      id: m.id,
      tournamentTitle: m.tournament_title || "Friendly Challenge",
      tournamentSlug: m.tournament_slug,
      roundLabel: m.round_label,
      playerOneId: m.player_one_id,
      playerOneUsername: m.player_one_username,
      playerTwoId: m.player_two_id,
      playerTwoUsername: m.player_two_username,
      playerOneScore: m.player_one_score !== null ? Number(m.player_one_score) : null,
      playerTwoScore: m.player_two_score !== null ? Number(m.player_two_score) : null,
      winnerId: m.winner_id,
      status: m.status,
      isFriendly: Boolean(m.is_friendly),
      scheduledAt: m.scheduled_at,
    })),
    tournaments: tournaments.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      format: t.format,
      platform: t.platform,
      status: t.status,
      startDate: t.start_date,
      registrationStatus: t.registration_status,
      isChampion: t.winner_id === row.id,
    })),
    achievements: achievements.map((a) => ({
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      tier: a.tier,
      awardedAt: a.awarded_at,
    })),
    ratingHistory: ratingHistory.map((re) => ({
      id: re.id,
      matchId: re.match_id,
      oldRating: Number(re.old_rating),
      newRating: Number(re.new_rating),
      ratingDelta: Number(re.rating_delta),
      createdAt: re.created_at,
    })),
  };
}

export function getPlayerDashboardData(user: AuthenticatedUser) {
  const db = getDb();
  const profile = getPlayerProfileByUsername(user.username, user.id)!;

  const notifications = db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`)
    .all(user.id) as any[];

  const challenges = db
    .prepare(`
      SELECT
        fc.*,
        u1.username as challenger_username,
        u2.username as opponent_username
      FROM friendly_challenges fc
      JOIN users u1 ON u1.id = fc.challenger_id
      JOIN users u2 ON u2.id = fc.opponent_id
      WHERE fc.challenger_id = ? OR fc.opponent_id = ?
      ORDER BY fc.created_at DESC
    `)
    .all(user.id, user.id) as any[];

  return {
    profile,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      linkUrl: n.link_url,
      readAt: n.read_at,
      createdAt: n.created_at,
    })),
    challenges: challenges.map((c) => ({
      id: c.id,
      challengerId: c.challenger_id,
      challengerUsername: c.challenger_username,
      opponentId: c.opponent_id,
      opponentUsername: c.opponent_username,
      platform: c.platform,
      proposedTime: c.proposed_time,
      message: c.message,
      status: c.status,
      matchId: c.match_id,
      createdAt: c.created_at,
    })),
  };
}

export function updatePlayerProfile(
  user: AuthenticatedUser,
  updates: {
    displayName: string;
    county: string;
    platform: string;
    efootballId?: string;
    bio?: string;
    university?: string;
  }
) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE profiles
    SET display_name = ?, county = ?, platform = ?, efootball_id = ?, bio = ?, university = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    updates.displayName.trim() || user.username,
    updates.county,
    updates.platform,
    updates.efootballId?.trim() || null,
    updates.bio?.trim() || null,
    updates.university?.trim() || null,
    now,
    user.id
  );
  return true;
}

/**
 * Friendly Challenge Workflow (Section 16)
 * No cash wagering permitted. Creates a dedicated friendly match room when accepted.
 */
export function createFriendlyChallenge(params: {
  challenger: AuthenticatedUser;
  opponentUsername: string;
  platform: string;
  proposedTime: string;
  message?: string;
}) {
  const db = getDb();
  const opponent = db
    .prepare(`SELECT id, username FROM users WHERE username = ? AND status = 'ACTIVE'`)
    .get(params.opponentUsername.trim()) as { id: string; username: string } | undefined;

  if (!opponent) {
    throw new Error("Opponent player not found.");
  }
  if (opponent.id === params.challenger.id) {
    throw new Error("You cannot challenge yourself.");
  }

  // Check if blocked
  const blocked = db
    .prepare(
      `SELECT id FROM player_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`
    )
    .get(params.challenger.id, opponent.id, opponent.id, params.challenger.id);
  if (blocked) {
    throw new Error("Cannot send challenge due to privacy/block settings.");
  }

  const now = new Date().toISOString();
  const id = createId("fch");
  db.prepare(`
    INSERT INTO friendly_challenges (
      id, challenger_id, opponent_id, platform, proposed_time, message, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `).run(
    id,
    params.challenger.id,
    opponent.id,
    params.platform,
    params.proposedTime,
    params.message?.trim() || null,
    now
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
    VALUES (?, ?, 'UPCOMING_MATCH', ?, ?, '/dashboard/challenges', ?)
  `).run(
    createId("ntf"),
    opponent.id,
    `New Friendly Challenge from ${params.challenger.username}`,
    `${params.challenger.username} challenged you to a friendly match (${params.platform}).`,
    now
  );

  return id;
}

export function respondToFriendlyChallenge(params: {
  challengeId: string;
  user: AuthenticatedUser;
  decision: "ACCEPTED" | "DECLINED";
}) {
  const db = getDb();
  const ch = db
    .prepare(`SELECT * FROM friendly_challenges WHERE id = ?`)
    .get(params.challengeId) as any;
  if (!ch) throw new Error("Challenge not found.");

  if (ch.opponent_id !== params.user.id) {
    throw new Error("Only the challenged opponent can accept or decline this challenge.");
  }
  if (ch.status !== "PENDING") {
    throw new Error(`Challenge is already ${ch.status}.`);
  }

  const now = new Date().toISOString();
  let matchId: string | null = null;

  db.exec("BEGIN");
  try {
    if (params.decision === "ACCEPTED") {
      matchId = createId("fmatch");
      db.prepare(`
        INSERT INTO tournament_matches (
          id, tournament_id, round_number, round_label, match_number, bracket_side,
          player_one_id, player_two_id, status, scheduled_at, is_friendly, created_at, updated_at
        ) VALUES (?, NULL, 1, 'Friendly Challenge Match', 1, 'WINNERS', ?, ?, 'READY', ?, 1, ?, ?)
      `).run(matchId, ch.challenger_id, ch.opponent_id, ch.proposed_time, now, now);
    }

    db.prepare(`
      UPDATE friendly_challenges SET status = ?, match_id = ? WHERE id = ?
    `).run(params.decision, matchId, ch.id);

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
      VALUES (?, ?, 'UPCOMING_MATCH', ?, ?, ?, ?)
    `).run(
      createId("ntf"),
      ch.challenger_id,
      `Friendly Challenge ${params.decision}: ${params.user.username}`,
      params.decision === "ACCEPTED"
        ? `${params.user.username} accepted your challenge! Enter the Match Room.`
        : `${params.user.username} declined the friendly challenge.`,
      matchId ? `/matches/${matchId}` : "/dashboard/challenges",
      now
    );

    db.exec("COMMIT");
    return { status: params.decision, matchId };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function toggleFollowPlayer(followerId: string, targetUsername: string) {
  const db = getDb();
  const target = db
    .prepare(`SELECT id FROM users WHERE username = ?`)
    .get(targetUsername) as { id: string } | undefined;
  if (!target) throw new Error("Player not found.");
  if (target.id === followerId) throw new Error("You cannot follow yourself.");

  const existing = db
    .prepare(`SELECT id FROM player_follows WHERE follower_id = ? AND following_id = ?`)
    .get(followerId, target.id) as { id: string } | undefined;

  if (existing) {
    db.prepare(`DELETE FROM player_follows WHERE id = ?`).run(existing.id);
    return { following: false };
  } else {
    db.prepare(`
      INSERT INTO player_follows (id, follower_id, following_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(createId("flw"), followerId, target.id, new Date().toISOString());
    return { following: true };
  }
}

export function markNotificationsRead(userId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`).run(
    now,
    userId
  );
}
