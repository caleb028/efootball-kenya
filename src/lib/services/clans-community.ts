// ============================================================================
// eFootball Kenya — Clans, Community Feed, News, Highlights & Livestreams
// Covers Sections 15, 19, 20
// ============================================================================

import { getDb, createId } from "@/lib/db";
import { AuthenticatedUser, hasAnyRole, writeAuditLog } from "@/lib/services/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createClan(params: {
  founder: AuthenticatedUser;
  name: string;
  tag: string;
  county: string;
  description: string;
}) {
  const db = getDb();
  const name = params.name.trim();
  const tag = params.tag.trim().toUpperCase();

  if (name.length < 3 || name.length > 40) {
    throw new Error("Clan name must be between 3 and 40 characters.");
  }
  if (!/^[A-Z0-9]{2,6}$/.test(tag)) {
    throw new Error("Clan tag must be 2–6 alphanumeric characters (e.g. NRB, KSM, 254).");
  }

  const existingMember = db
    .prepare(`SELECT clan_id FROM clan_members WHERE user_id = ?`)
    .get(params.founder.id);
  if (existingMember) {
    throw new Error("You are already a member of a clan. Leave your current clan before founding a new one.");
  }

  const dup = db
    .prepare(`SELECT id FROM clans WHERE name = ? OR tag = ?`)
    .get(name, tag);
  if (dup) {
    throw new Error("A clan with that name or tag already exists.");
  }

  const id = createId("cln");
  const slug = `${slugify(name)}-${tag.toLowerCase()}`;
  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO clans (
        id, name, tag, slug, description, county, founder_id, rating, wins, draws, losses, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
    `).run(id, name, tag, slug, params.description.trim(), params.county, params.founder.id, params.founder.rating, now);

    db.prepare(`
      INSERT INTO clan_members (id, clan_id, user_id, role, status, joined_at)
      VALUES (?, ?, ?, 'OWNER', 'ACTIVE', ?)
    `).run(createId("cmem"), id, params.founder.id, now);

    db.prepare(`UPDATE profiles SET clan_id = ?, updated_at = ? WHERE user_id = ?`).run(
      id,
      now,
      params.founder.id
    );

    db.prepare(`
      INSERT INTO activity_events (id, actor_id, event_type, title, body, link_url, created_at)
      VALUES (?, ?, 'CLAN_MILESTONE', ?, ?, ?, ?)
    `).run(
      createId("act"),
      params.founder.id,
      `New Clan Founded: [${tag}] ${name}`,
      `${params.founder.username} established [${tag}] ${name} representing ${params.county} County.`,
      `/clans/${slug}`,
      now
    );

    writeAuditLog({
      actorId: params.founder.id,
      action: "CLAN_CREATED",
      entityType: "CLAN",
      entityId: id,
      details: `[${tag}] ${name}`,
    });

    db.exec("COMMIT");
    return getClanBySlugOrId(slug)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function listClans(filters?: { county?: string; search?: string; limit?: number }) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.county && filters.county !== "ALL") {
    conditions.push("c.county = ?");
    params.push(filters.county);
  }
  if (filters?.search?.trim()) {
    conditions.push("(c.name LIKE ? OR c.tag LIKE ? OR c.county LIKE ?)");
    const q = `%${filters.search.trim()}%`;
    params.push(q, q, q);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit ?? 50;

  const rows = db
    .prepare(`
      SELECT
        c.*,
        u.username as founder_username,
        (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id = c.id AND cm.status = 'ACTIVE') as member_count,
        (SELECT AVG(r.rating) FROM clan_members cm JOIN player_ratings r ON r.user_id = cm.user_id WHERE cm.clan_id = c.id AND cm.status = 'ACTIVE') as avg_member_rating
      FROM clans c
      LEFT JOIN users u ON u.id = c.founder_id
      ${whereSql}
      ORDER BY c.rating DESC, member_count DESC, c.created_at ASC
      LIMIT ?
    `)
    .all(...params, limit) as any[];

  return rows.map((r, idx) => ({
    rank: idx + 1,
    id: r.id,
    name: r.name,
    tag: r.tag,
    slug: r.slug,
    description: r.description,
    county: r.county,
    founderId: r.founder_id,
    founderUsername: r.founder_username,
    rating: Math.round(Number(r.avg_member_rating || r.rating || 1200)),
    wins: Number(r.wins),
    draws: Number(r.draws),
    losses: Number(r.losses),
    memberCount: Number(r.member_count ?? 1),
    createdAt: r.created_at,
  }));
}

export function getClanBySlugOrId(slugOrId: string) {
  const db = getDb();
  const c = db
    .prepare(`
      SELECT c.*, u.username as founder_username
      FROM clans c
      LEFT JOIN users u ON u.id = c.founder_id
      WHERE c.slug = ? OR c.id = ?
    `)
    .get(slugOrId, slugOrId) as any;

  if (!c) return null;

  const members = db
    .prepare(`
      SELECT
        cm.id, cm.user_id, cm.role, cm.status, cm.joined_at,
        u.username, p.display_name, p.county, p.platform,
        COALESCE(r.rating, 1200) as rating,
        COALESCE(r.wins, 0) as wins,
        COALESCE(r.matches_played, 0) as matches_played
      FROM clan_members cm
      JOIN users u ON u.id = cm.user_id
      LEFT JOIN profiles p ON p.user_id = cm.user_id
      LEFT JOIN player_ratings r ON r.user_id = cm.user_id
      WHERE cm.clan_id = ?
      ORDER BY
        CASE cm.role WHEN 'OWNER' THEN 1 WHEN 'CAPTAIN' THEN 2 ELSE 3 END ASC,
        r.rating DESC
    `)
    .all(c.id) as any[];

  const announcements = db
    .prepare(`
      SELECT ca.*, u.username as author_username
      FROM clan_announcements ca
      JOIN users u ON u.id = ca.author_id
      WHERE ca.clan_id = ?
      ORDER BY ca.created_at DESC
    `)
    .all(c.id) as any[];

  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const avgRating =
    activeMembers.length > 0
      ? Math.round(
          activeMembers.reduce((sum, m) => sum + Number(m.rating), 0) / activeMembers.length
        )
      : Number(c.rating);

  return {
    id: c.id,
    name: c.name,
    tag: c.tag,
    slug: c.slug,
    description: c.description,
    county: c.county,
    founderId: c.founder_id,
    founderUsername: c.founder_username,
    rating: avgRating,
    wins: Number(c.wins),
    draws: Number(c.draws),
    losses: Number(c.losses),
    createdAt: c.created_at,
    members: activeMembers.map((m) => ({
      id: m.id,
      userId: m.user_id,
      username: m.username,
      displayName: m.display_name || m.username,
      county: m.county || "Nairobi",
      platform: m.platform || "MOBILE",
      role: m.role,
      rating: Number(m.rating),
      wins: Number(m.wins),
      matchesPlayed: Number(m.matches_played),
      joinedAt: m.joined_at,
    })),
    pendingRequests: members
      .filter((m) => m.status === "PENDING_APPROVAL")
      .map((m) => ({
        id: m.id,
        userId: m.user_id,
        username: m.username,
        displayName: m.display_name || m.username,
        county: m.county || "Nairobi",
        platform: m.platform || "MOBILE",
        rating: Number(m.rating),
        joinedAt: m.joined_at,
      })),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      authorUsername: a.author_username,
      createdAt: a.created_at,
    })),
  };
}

export function requestToJoinClan(clanIdOrSlug: string, user: AuthenticatedUser) {
  const db = getDb();
  const clan = getClanBySlugOrId(clanIdOrSlug);
  if (!clan) throw new Error("Clan not found.");

  const existing = db
    .prepare(`SELECT id, status FROM clan_members WHERE user_id = ?`)
    .get(user.id) as { id: string; status: string } | undefined;

  if (existing) {
    throw new Error("You are already associated with a clan.");
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO clan_members (id, clan_id, user_id, role, status, joined_at)
    VALUES (?, ?, ?, 'MEMBER', 'PENDING_APPROVAL', ?)
  `).run(createId("cmem"), clan.id, user.id, now);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
    VALUES (?, ?, 'CLAN_INVITE', ?, ?, ?, ?)
  `).run(
    createId("ntf"),
    clan.founderId,
    `New Clan Join Request: ${user.username}`,
    `${user.username} requested to join [${clan.tag}] ${clan.name}.`,
    `/clans/${clan.slug}`,
    now
  );

  return true;
}

export function manageClanMember(params: {
  clanIdOrSlug: string;
  actor: AuthenticatedUser;
  targetUserId: string;
  action: "APPROVE" | "PROMOTE_CAPTAIN" | "DEMOTE_MEMBER" | "REMOVE";
}) {
  const db = getDb();
  const clan = getClanBySlugOrId(params.clanIdOrSlug);
  if (!clan) throw new Error("Clan not found.");

  const actorMember = db
    .prepare(`SELECT role FROM clan_members WHERE clan_id = ? AND user_id = ? AND status = 'ACTIVE'`)
    .get(clan.id, params.actor.id) as { role: string } | undefined;

  const isAdmin = hasAnyRole(params.actor, ["SUPER_ADMIN", "MODERATOR"]);
  if (!actorMember && !isAdmin) {
    throw new Error("Only clan leadership can manage members.");
  }
  if (actorMember && actorMember.role !== "OWNER" && actorMember.role !== "CAPTAIN" && !isAdmin) {
    throw new Error("Only Clan Owners and Captains can manage members.");
  }

  const now = new Date().toISOString();
  if (params.action === "APPROVE") {
    db.prepare(`UPDATE clan_members SET status = 'ACTIVE', joined_at = ? WHERE clan_id = ? AND user_id = ?`).run(
      now,
      clan.id,
      params.targetUserId
    );
    db.prepare(`UPDATE profiles SET clan_id = ?, updated_at = ? WHERE user_id = ?`).run(
      clan.id,
      now,
      params.targetUserId
    );
  } else if (params.action === "PROMOTE_CAPTAIN") {
    db.prepare(`UPDATE clan_members SET role = 'CAPTAIN' WHERE clan_id = ? AND user_id = ?`).run(
      clan.id,
      params.targetUserId
    );
  } else if (params.action === "DEMOTE_MEMBER") {
    db.prepare(`UPDATE clan_members SET role = 'MEMBER' WHERE clan_id = ? AND user_id = ?`).run(
      clan.id,
      params.targetUserId
    );
  } else if (params.action === "REMOVE") {
    db.prepare(`DELETE FROM clan_members WHERE clan_id = ? AND user_id = ?`).run(
      clan.id,
      params.targetUserId
    );
    db.prepare(`UPDATE profiles SET clan_id = NULL, updated_at = ? WHERE user_id = ?`).run(
      now,
      params.targetUserId
    );
  }

  return getClanBySlugOrId(clan.id)!;
}

export function postClanAnnouncement(params: {
  clanIdOrSlug: string;
  author: AuthenticatedUser;
  title: string;
  content: string;
}) {
  const db = getDb();
  const clan = getClanBySlugOrId(params.clanIdOrSlug);
  if (!clan) throw new Error("Clan not found.");

  const member = db
    .prepare(`SELECT role FROM clan_members WHERE clan_id = ? AND user_id = ? AND status = 'ACTIVE'`)
    .get(clan.id, params.author.id) as { role: string } | undefined;

  if (!member || (member.role !== "OWNER" && member.role !== "CAPTAIN")) {
    throw new Error("Only Clan Owners and Captains can post clan announcements.");
  }

  db.prepare(`
    INSERT INTO clan_announcements (id, clan_id, author_id, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    createId("cann"),
    clan.id,
    params.author.id,
    params.title.trim(),
    params.content.trim(),
    new Date().toISOString()
  );

  return true;
}

// ----------------------------------------------------------------------------
// COMMUNITY FEED, REACTIONS, COMMENTS & REPORTS (Section 19)
// ----------------------------------------------------------------------------

export function listCommunityEvents(limit = 25, viewerId?: string | null) {
  const db = getDb();
  const events = db
    .prepare(`
      SELECT
        ae.*,
        u.username as actor_username,
        p.county as actor_county,
        p.avatar_url as actor_avatar
      FROM activity_events ae
      LEFT JOIN users u ON u.id = ae.actor_id
      LEFT JOIN profiles p ON p.user_id = ae.actor_id
      ORDER BY ae.created_at DESC
      LIMIT ?
    `)
    .all(limit) as any[];

  return events.map((ev) => {
    const comments = db
      .prepare(`
        SELECT c.*, u.username as author_username, p.avatar_url as author_avatar
        FROM comments c
        JOIN users u ON u.id = c.author_id
        LEFT JOIN profiles p ON p.user_id = c.author_id
        WHERE c.event_id = ?
        ORDER BY c.created_at ASC
      `)
      .all(ev.id) as any[];

    const reactions = db
      .prepare(`SELECT emoji, user_id FROM reactions WHERE event_id = ?`)
      .all(ev.id) as { emoji: string; user_id: string }[];

    const reactionCounts: Record<string, number> = {
      LIKE: 0,
      LOVE: 0,
      FIRE: 0,
      TROPHY: 0,
    };
    let userReaction: string | null = null;
    for (const r of reactions) {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
      if (viewerId && r.user_id === viewerId) {
        userReaction = r.emoji;
      }
    }

    return {
      id: ev.id,
      actorId: ev.actor_id,
      actorUsername: ev.actor_username || "eFootball Kenya",
      actorCounty: ev.actor_county || "Kenya",
      actorAvatar: ev.actor_avatar || null,
      eventType: ev.event_type,
      title: ev.title,
      body: ev.body,
      mediaUrl: ev.media_url || null,
      mediaType: ev.media_type || (ev.media_url ? "IMAGE" : null),
      linkUrl: ev.link_url,
      createdAt: ev.created_at,
      reactionCount: reactions.length,
      reactionCounts,
      viewerReacted: Boolean(userReaction),
      userReaction,
      comments: comments.map((c) => ({
        id: c.id,
        authorId: c.author_id,
        authorUsername: c.author_username,
        authorAvatar: c.author_avatar || null,
        content: c.content,
        createdAt: c.created_at,
      })),
    };
  });
}

export function createCommunityPost(params: {
  author: AuthenticatedUser;
  eventType?: string;
  title: string;
  body: string;
  mediaUrl?: string;
  linkUrl?: string;
}) {
  if (!params.title.trim() || !params.body.trim()) {
    throw new Error("Title and post content are required.");
  }
  const db = getDb();
  const id = createId("act");
  db.prepare(`
    INSERT INTO activity_events (id, actor_id, event_type, title, body, media_url, media_type, link_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.author.id,
    params.eventType || "HIGHLIGHT",
    params.title.trim(),
    params.body.trim(),
    params.mediaUrl?.trim() || null,
    params.mediaUrl ? "IMAGE" : null,
    params.linkUrl?.trim() || null,
    new Date().toISOString()
  );
  return id;
}

export function addCommunityComment(params: {
  eventId: string;
  author: AuthenticatedUser;
  content: string;
}) {
  if (!params.content.trim()) throw new Error("Comment cannot be empty.");
  const db = getDb();
  const id = createId("cmt");
  db.prepare(`
    INSERT INTO comments (id, event_id, author_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, params.eventId, params.author.id, params.content.trim(), new Date().toISOString());
  return id;
}

export function toggleCommunityReaction(eventId: string, userId: string, emoji = "LIKE") {
  const db = getDb();
  const validEmoji = ["LIKE", "LOVE", "FIRE", "TROPHY"].includes(emoji) ? emoji : "LIKE";
  const existing = db
    .prepare(`SELECT id, emoji FROM reactions WHERE event_id = ? AND user_id = ?`)
    .get(eventId, userId) as { id: string; emoji: string } | undefined;

  if (existing) {
    if (existing.emoji === validEmoji) {
      db.prepare(`DELETE FROM reactions WHERE id = ?`).run(existing.id);
      return { reacted: false, emoji: null };
    } else {
      db.prepare(`UPDATE reactions SET emoji = ? WHERE id = ?`).run(validEmoji, existing.id);
      return { reacted: true, emoji: validEmoji };
    }
  } else {
    db.prepare(`
      INSERT INTO reactions (id, event_id, user_id, emoji, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(createId("rxn"), eventId, userId, validEmoji, new Date().toISOString());
    return { reacted: true, emoji: validEmoji };
  }
}

// ----------------------------------------------------------------------------
// CHAT GROUPS & REAL-TIME COMMUNITY MESSAGING
// ----------------------------------------------------------------------------

export function listChatGroups(userId?: string) {
  const db = getDb();
  const groups = db
    .prepare(`
      SELECT
        cg.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM chat_group_members WHERE group_id = cg.id) as member_count,
        (SELECT COUNT(*) FROM chat_messages WHERE group_id = cg.id) as message_count,
        (
          SELECT cm.message FROM chat_messages cm WHERE cm.group_id = cg.id ORDER BY cm.created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT cm.created_at FROM chat_messages cm WHERE cm.group_id = cg.id ORDER BY cm.created_at DESC LIMIT 1
        ) as last_message_at
      FROM chat_groups cg
      LEFT JOIN users u ON u.id = cg.created_by_id
      ORDER BY last_message_at DESC NULLS LAST, cg.created_at ASC
    `)
    .all() as any[];

  return groups.map((g) => {
    const isMember = userId
      ? Boolean(
          db
            .prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`)
            .get(g.id, userId)
        )
      : false;

    return {
      id: g.id,
      name: g.name,
      description: g.description || "",
      category: g.category || "GENERAL",
      avatarUrl: g.avatar_url || null,
      creatorUsername: g.creator_username || "Admin",
      memberCount: Number(g.member_count || 1),
      messageCount: Number(g.message_count || 0),
      lastMessage: g.last_message || null,
      lastMessageAt: g.last_message_at || g.created_at,
      isMember,
    };
  });
}

export function createChatGroup(params: {
  name: string;
  description?: string;
  category?: string;
  author: AuthenticatedUser;
}) {
  if (!params.name.trim()) throw new Error("Group name is required.");
  const db = getDb();
  const id = createId("grp");
  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO chat_groups (id, name, description, category, created_by_id, is_private, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      params.name.trim(),
      params.description?.trim() || "eFootball Kenya competitive chat lounge.",
      params.category || "GENERAL",
      params.author.id,
      now
    );

    db.prepare(`
      INSERT INTO chat_group_members (id, group_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'OWNER', ?)
    `).run(createId("gm"), id, params.author.id, now);

    db.prepare(`
      INSERT INTO chat_messages (id, group_id, sender_id, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      createId("msg"),
      id,
      params.author.id,
      `Welcome to ${params.name.trim()}! Introduce yourself and share your eFootball ID.`,
      now
    );

    db.exec("COMMIT");
    return id;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function joinChatGroup(groupId: string, userId: string) {
  const db = getDb();
  const group = db.prepare(`SELECT id FROM chat_groups WHERE id = ?`).get(groupId);
  if (!group) throw new Error("Chat group not found.");

  const existing = db
    .prepare(`SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?`)
    .get(groupId, userId);

  if (!existing) {
    db.prepare(`
      INSERT INTO chat_group_members (id, group_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'MEMBER', ?)
    `).run(createId("gm"), groupId, userId, new Date().toISOString());
  }
  return true;
}

export function getChatGroupMessages(groupId: string, limit = 50) {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        cm.*,
        u.username as sender_username,
        p.display_name,
        p.avatar_url,
        p.county
      FROM chat_messages cm
      JOIN users u ON u.id = cm.sender_id
      LEFT JOIN profiles p ON p.user_id = cm.sender_id
      WHERE cm.group_id = ?
      ORDER BY cm.created_at ASC
      LIMIT ?
    `)
    .all(groupId, limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    senderId: r.sender_id,
    senderUsername: r.sender_username,
    displayName: r.display_name || r.sender_username,
    avatarUrl: r.avatar_url || null,
    county: r.county || "Kenya",
    message: r.message,
    mediaUrl: r.media_url || null,
    createdAt: r.created_at,
  }));
}

export function sendChatMessage(params: {
  groupId: string;
  sender: AuthenticatedUser;
  message: string;
  mediaUrl?: string;
}) {
  if (!params.message.trim() && !params.mediaUrl) {
    throw new Error("Message cannot be empty.");
  }
  const db = getDb();
  joinChatGroup(params.groupId, params.sender.id);

  const id = createId("msg");
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO chat_messages (id, group_id, sender_id, message, media_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.groupId,
    params.sender.id,
    params.message.trim(),
    params.mediaUrl?.trim() || null,
    now
  );

  return { id, createdAt: now };
}

export function submitModerationReport(params: {
  reporter: AuthenticatedUser;
  targetType: "PLAYER" | "LISTING" | "COMMENT" | "CLAN";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const db = getDb();
  const id = createId("rpt");
  db.prepare(`
    INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
  `).run(
    id,
    params.reporter.id,
    params.targetType,
    params.targetId,
    params.reason.trim(),
    params.details?.trim() || null,
    new Date().toISOString()
  );
  return id;
}

// ----------------------------------------------------------------------------
// NEWS, HIGHLIGHTS & LIVESTREAMS (Section 20)
// ----------------------------------------------------------------------------

export function listArticles(filters?: { categorySlug?: string; highlightsOnly?: boolean }) {
  const db = getDb();
  const conditions: string[] = ["a.is_published = 1"];
  const params: any[] = [];

  if (filters?.categorySlug && filters.categorySlug !== "ALL") {
    conditions.push("ac.slug = ?");
    params.push(filters.categorySlug);
  }
  if (filters?.highlightsOnly) {
    conditions.push("a.is_highlight = 1");
  }

  const rows = db
    .prepare(`
      SELECT
        a.*,
        ac.name as category_name,
        ac.slug as category_slug,
        u.username as author_username
      FROM articles a
      JOIN article_categories ac ON ac.id = a.category_id
      LEFT JOIN users u ON u.id = a.author_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.published_at DESC
    `)
    .all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    authorUsername: r.author_username || "Editorial Team",
    coverUrl: r.cover_url,
    videoEmbed: r.video_embed,
    isHighlight: Boolean(r.is_highlight),
    publishedAt: r.published_at,
  }));
}

export function getArticleBySlug(slug: string) {
  const db = getDb();
  const r = db
    .prepare(`
      SELECT
        a.*,
        ac.name as category_name,
        ac.slug as category_slug,
        u.username as author_username
      FROM articles a
      JOIN article_categories ac ON ac.id = a.category_id
      LEFT JOIN users u ON u.id = a.author_id
      WHERE a.slug = ? OR a.id = ?
    `)
    .get(slug, slug) as any;

  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    authorUsername: r.author_username || "Editorial Team",
    coverUrl: r.cover_url,
    videoEmbed: r.video_embed,
    isHighlight: Boolean(r.is_highlight),
    publishedAt: r.published_at,
  };
}

export function createArticle(params: {
  author: AuthenticatedUser;
  title: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  videoEmbed?: string;
  isHighlight?: boolean;
}) {
  if (!hasAnyRole(params.author, ["CONTENT_EDITOR", "TOURNAMENT_ADMIN", "SUPER_ADMIN"])) {
    throw new Error("Unauthorised: Content Editor or Admin role required to publish articles.");
  }

  const db = getDb();
  const cat = db
    .prepare(`SELECT id FROM article_categories WHERE slug = ?`)
    .get(params.categorySlug) as { id: string } | undefined;

  if (!cat) throw new Error("Invalid article category.");

  const id = createId("art");
  const slug = `${slugify(params.title)}-${id.slice(-5)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO articles (
      id, slug, title, excerpt, content, category_id, author_id, video_embed, is_highlight, is_published, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    slug,
    params.title.trim(),
    params.excerpt.trim(),
    params.content.trim(),
    cat.id,
    params.author.id,
    params.videoEmbed?.trim() || null,
    params.isHighlight ? 1 : 0,
    now
  );

  return getArticleBySlug(slug)!;
}
