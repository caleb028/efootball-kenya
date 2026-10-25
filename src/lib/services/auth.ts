// ============================================================================
// eFootball Kenya — Authentication, Sessions, RBAC & Security Service (Section 6 & 32)
// ============================================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, createId } from "@/lib/db";
import { KENYA_COUNTIES } from "@/lib/constants/kenya";

const JWT_SECRET =
  process.env.JWT_SECRET || "efootball-kenya-production-jwt-secret-replace-in-prod-2026";
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "efk_session";
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE_SECONDS || 604800);

export type UserRoleName =
  | "PLAYER"
  | "ORGANISER"
  | "MODERATOR"
  | "TOURNAMENT_ADMIN"
  | "FINANCE_ADMIN"
  | "CONTENT_EDITOR"
  | "SUPER_ADMIN";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  status: string;
  emailVerifiedAt: string | null;
  displayName: string;
  county: string;
  platform: string;
  efootballId: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  university: string | null;
  clanId: string | null;
  rating: number;
  roles: UserRoleName[];
}

// Rate limiter store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 15,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function writeAuditLog(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    createId("audit"),
    params.actorId ?? null,
    params.action,
    params.entityType,
    params.entityId,
    params.details ?? null,
    params.ipAddress ?? null,
    new Date().toISOString()
  );
}

export interface RegisterUserInput {
  username: string;
  displayName: string;
  email: string;
  password: string;
  county: string;
  platform: string;
  efootballId?: string;
  bio?: string;
  university?: string;
  ageConfirmed: boolean;
  termsAccepted: boolean;
  initialRoles?: UserRoleName[];
}

export async function registerUser(input: RegisterUserInput): Promise<{
  user: AuthenticatedUser;
  verificationToken: string;
}> {
  const db = getDb();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) {
    throw new Error(
      "Username must be 3–24 characters using letters, numbers, underscores, dots, or hyphens."
    );
  }
  if (!email.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  if (!input.ageConfirmed) {
    throw new Error("You must confirm age eligibility (13+) to participate.");
  }
  if (!input.termsAccepted) {
    throw new Error("You must accept the eFootball Kenya Terms & Fair Play Charter.");
  }
  if (!KENYA_COUNTIES.includes(input.county as any)) {
    throw new Error("Please select a valid Kenyan county.");
  }

  const existing = db
    .prepare(`SELECT id, username, email FROM users WHERE username = ? OR email = ?`)
    .get(username, email) as { id: string; username: string; email: string } | undefined;

  if (existing) {
    if (existing.username.toLowerCase() === username.toLowerCase()) {
      throw new Error("Username is already taken by another player.");
    }
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = createId("usr");
  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, status, age_confirmed, terms_accepted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
    `).run(userId, username, email, passwordHash, input.ageConfirmed ? 1 : 0, now, now, now);

    db.prepare(`
      INSERT INTO profiles (
        id, user_id, display_name, county, platform, efootball_id, bio, is_verified, university, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      createId("prf"),
      userId,
      displayName,
      input.county,
      input.platform,
      input.efootballId?.trim() || null,
      input.bio?.trim() || null,
      input.university?.trim() || null,
      now,
      now
    );

    if (input.efootballId?.trim()) {
      db.prepare(`
        INSERT INTO player_platform_ids (id, user_id, platform, handle, verified, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(createId("pid"), userId, input.platform, input.efootballId.trim(), now);
    }

    db.prepare(`
      INSERT INTO player_ratings (
        id, user_id, rating, peak_rating, last_rating_change, matches_played, wins, draws, losses,
        goals_scored, goals_conceded, tournaments_played, tournaments_won, current_streak, best_streak, updated_at
      ) VALUES (?, ?, 1200, 1200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?)
    `).run(createId("rtg"), userId, now);

    db.prepare(`
      INSERT INTO user_preferences (id, user_id, reduced_motion, allow_challenges, profile_public, timezone, updated_at)
      VALUES (?, ?, 0, 1, 1, 'Africa/Nairobi', ?)
    `).run(createId("pref"), userId, now);

    db.prepare(`
      INSERT INTO notification_preferences (id, user_id, in_app, email, sms, web_push, match_alerts)
      VALUES (?, ?, 1, 1, 0, 1, 1)
    `).run(createId("npref"), userId);

    const rolesToAssign = new Set<UserRoleName>(["PLAYER", ...(input.initialRoles || [])]);
    const insertRole = db.prepare(`
      INSERT OR IGNORE INTO user_roles (id, user_id, role, granted_by, created_at)
      VALUES (?, ?, ?, 'SYSTEM', ?)
    `);
    for (const r of rolesToAssign) {
      insertRole.run(createId("role"), userId, r, now);
    }

    // Create email verification token
    const verificationToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    db.prepare(`
      INSERT INTO verification_tokens (id, identifier, token, purpose, expires_at, created_at)
      VALUES (?, ?, ?, 'EMAIL_VERIFY', ?, ?)
    `).run(createId("vt"), email, verificationToken, expiresAt, now);

    // Welcome notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
      VALUES (?, ?, 'ANNOUNCEMENT', 'Karibu to eFootball Kenya!', 'Your player profile is live with a starting 1200 Elo rating. Explore upcoming tournaments and represent your county!', '/tournaments', ?)
    `).run(createId("ntf"), userId, now);

    writeAuditLog({
      actorId: userId,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: userId,
      details: `Registered ${username} (${input.county}, ${input.platform})`,
    });

    db.exec("COMMIT");

    const user = getUserById(userId)!;
    return { user, verificationToken };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export async function authenticateUser(params: {
  identifier: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ user: AuthenticatedUser; sessionToken: string }> {
  const db = getDb();
  const ident = params.identifier.trim();

  const row = db
    .prepare(`SELECT id, username, email, password_hash, status, suspension_reason FROM users WHERE username = ? OR email = ?`)
    .get(ident, ident.toLowerCase()) as
    | {
        id: string;
        username: string;
        email: string;
        password_hash: string | null;
        status: string;
        suspension_reason: string | null;
      }
    | undefined;

  if (!row || !row.password_hash) {
    throw new Error("Invalid username/email or password.");
  }

  const valid = await bcrypt.compare(params.password, row.password_hash);
  if (!valid) {
    throw new Error("Invalid username/email or password.");
  }

  if (row.status === "SUSPENDED" || row.status === "BANNED") {
    throw new Error(
      `Your account is currently ${row.status.toLowerCase()}${
        row.suspension_reason ? `: ${row.suspension_reason}` : "."
      }`
    );
  }

  if (row.status === "DELETED") {
    throw new Error("This account has been deleted.");
  }

  const sessionToken = createSessionForUser(row.id, params.ipAddress, params.userAgent);
  const user = getUserById(row.id)!;
  return { user, sessionToken };
}

export function createSessionForUser(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): string {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000);
  const sessionId = createId("ses");
  const rawToken = jwt.sign({ sid: sessionId, sub: userId }, JWT_SECRET, {
    expiresIn: SESSION_MAX_AGE,
  });

  db.prepare(`
    INSERT INTO sessions (id, user_id, session_token, ip_address, user_agent, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    userId,
    rawToken,
    ipAddress ?? null,
    userAgent ?? null,
    expiresAt.toISOString(),
    now.toISOString()
  );

  db.prepare(`UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?`).run(
    now.toISOString(),
    now.toISOString(),
    userId
  );

  return rawToken;
}

export function revokeSession(sessionToken: string) {
  const db = getDb();
  db.prepare(`UPDATE sessions SET revoked_at = ? WHERE session_token = ?`).run(
    new Date().toISOString(),
    sessionToken
  );
}

export function revokeAllUserSessions(userId: string) {
  const db = getDb();
  db.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`).run(
    new Date().toISOString(),
    userId
  );
}

export function verifyEmailToken(token: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT id, identifier, expires_at, used_at FROM verification_tokens WHERE token = ? AND purpose = 'EMAIL_VERIFY'`
    )
    .get(token) as
    | { id: string; identifier: string; expires_at: string; used_at: string | null }
    | undefined;

  if (!row || row.used_at || row.expires_at < now) {
    return false;
  }

  db.prepare(`UPDATE verification_tokens SET used_at = ? WHERE id = ?`).run(now, row.id);
  db.prepare(`UPDATE users SET email_verified_at = ?, updated_at = ? WHERE email = ?`).run(
    now,
    now,
    row.identifier
  );
  return true;
}

export function createPasswordResetToken(email: string): string | null {
  const db = getDb();
  const user = db
    .prepare(`SELECT id, email FROM users WHERE email = ?`)
    .get(email.trim().toLowerCase()) as { id: string; email: string } | undefined;
  if (!user) return null;

  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  db.prepare(`
    INSERT INTO verification_tokens (id, identifier, token, purpose, expires_at, created_at)
    VALUES (?, ?, ?, 'PASSWORD_RESET', ?, ?)
  `).run(createId("vt"), user.email, token, expiresAt, now);

  writeAuditLog({
    actorId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "USER",
    entityId: user.id,
  });

  return token;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }
  const db = getDb();
  const now = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT id, identifier, expires_at, used_at FROM verification_tokens WHERE token = ? AND purpose = 'PASSWORD_RESET'`
    )
    .get(token) as
    | { id: string; identifier: string; expires_at: string; used_at: string | null }
    | undefined;

  if (!row || row.used_at || row.expires_at < now) {
    return false;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const user = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .get(row.identifier) as { id: string } | undefined;
  if (!user) return false;

  db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(
    hash,
    now,
    user.id
  );
  db.prepare(`UPDATE verification_tokens SET used_at = ? WHERE id = ?`).run(now, row.id);
  revokeAllUserSessions(user.id);

  writeAuditLog({
    actorId: user.id,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "USER",
    entityId: user.id,
  });

  return true;
}

export function getUserById(userId: string): AuthenticatedUser | null {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT
        u.id, u.username, u.email, u.status, u.email_verified_at,
        p.display_name, p.county, p.platform, p.efootball_id, p.bio, p.avatar_url, p.is_verified, p.university, p.clan_id,
        COALESCE(r.rating, 1200) as rating
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN player_ratings r ON r.user_id = u.id
      WHERE u.id = ?
    `)
    .get(userId) as any;

  if (!row) return null;

  const rolesRows = db
    .prepare(`SELECT role FROM user_roles WHERE user_id = ?`)
    .all(userId) as Array<{ role: UserRoleName }>;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    status: row.status,
    emailVerifiedAt: row.email_verified_at,
    displayName: row.display_name || row.username,
    county: row.county || "Nairobi",
    platform: row.platform || "MOBILE",
    efootballId: row.efootball_id,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isVerified: Boolean(row.is_verified),
    university: row.university,
    clanId: row.clan_id,
    rating: Number(row.rating ?? 1200),
    roles: rolesRows.map((r) => r.role),
  };
}

export function getUserBySessionToken(token: string | undefined | null): AuthenticatedUser | null {
  if (!token) return null;
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const session = db
    .prepare(
      `SELECT user_id, expires_at, revoked_at FROM sessions WHERE session_token = ?`
    )
    .get(token) as { user_id: string; expires_at: string; revoked_at: string | null } | undefined;

  if (!session || session.revoked_at || session.expires_at < now) {
    return null;
  }

  const user = getUserById(session.user_id);
  if (!user || user.status === "SUSPENDED" || user.status === "BANNED" || user.status === "DELETED") {
    return null;
  }
  return user;
}

export function getCurrentUser(): AuthenticatedUser | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return getUserBySessionToken(token);
  } catch {
    return null;
  }
}

export function hasAnyRole(user: AuthenticatedUser | null, allowedRoles: UserRoleName[]): boolean {
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return allowedRoles.some((r) => user.roles.includes(r));
}

export function grantUserRole(
  targetUserId: string,
  role: UserRoleName,
  grantedByUserId: string
) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO user_roles (id, user_id, role, granted_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(createId("role"), targetUserId, role, grantedByUserId, now);

  writeAuditLog({
    actorId: grantedByUserId,
    action: "ROLE_GRANTED",
    entityType: "USER",
    entityId: targetUserId,
    details: `Granted role ${role}`,
  });
}
