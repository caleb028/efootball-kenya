// ============================================================================
// eFootball Kenya — Gaming Marketplace, Financial Ledger, Sponsors & Admin RBAC
// Covers Sections 17, 18, 21, 22, 24, 25, 32
// ============================================================================

import { getDb, createId } from "@/lib/db";
import {
  AuthenticatedUser,
  hasAnyRole,
  UserRoleName,
  writeAuditLog,
  revokeAllUserSessions,
} from "@/lib/services/auth";
import { PROHIBITED_MARKETPLACE_KEYWORDS } from "@/lib/constants/kenya";

// ----------------------------------------------------------------------------
// 1. GAMING MARKETPLACE (Section 17)
// ----------------------------------------------------------------------------

export function containsProhibitedMarketplaceContent(text: string): {
  prohibited: boolean;
  matchedTerm?: string;
} {
  const lower = text.toLowerCase();
  for (const term of PROHIBITED_MARKETPLACE_KEYWORDS) {
    if (lower.includes(term)) {
      return { prohibited: true, matchedTerm: term };
    }
  }
  return { prohibited: false };
}

export function createMarketplaceListing(params: {
  user: AuthenticatedUser;
  categorySlug: string;
  title: string;
  description: string;
  priceKes: number;
  fulfilmentTerms: string;
}) {
  const db = getDb();
  const title = params.title.trim();
  const description = params.description.trim();
  const fulfilmentTerms = params.fulfilmentTerms.trim();
  const priceKes = Math.floor(Number(params.priceKes));

  if (!title || !description || !fulfilmentTerms) {
    throw new Error("Title, description, and fulfilment terms are required.");
  }
  if (isNaN(priceKes) || priceKes < 50 || priceKes > 500_000) {
    throw new Error("Price must be between KES 50 and KES 500,000.");
  }

  // Enforce Section 17 & 35 rule: Prohibit eFootball account trading / credential handovers
  const check = containsProhibitedMarketplaceContent(`${title} ${description} ${fulfilmentTerms}`);
  if (check.prohibited) {
    throw new Error(
      `Prohibited Listing Policy: Listings involving "${check.matchedTerm}" (account trading, credential handovers, or unauthorised asset transfers) are strictly prohibited on eFootball Kenya.`
    );
  }

  const category = db
    .prepare(`SELECT id, is_permitted FROM marketplace_categories WHERE slug = ?`)
    .get(params.categorySlug) as { id: string; is_permitted: number } | undefined;

  if (!category || !category.is_permitted) {
    throw new Error("Please select a permitted marketplace category.");
  }

  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    // Ensure seller profile exists
    let seller = db
      .prepare(`SELECT id, status FROM seller_profiles WHERE user_id = ?`)
      .get(params.user.id) as { id: string; status: string } | undefined;

    if (seller && seller.status === "SUSPENDED") {
      throw new Error("Your seller privileges are currently suspended.");
    }

    if (!seller) {
      const sellerId = createId("slr");
      db.prepare(`
        INSERT INTO seller_profiles (
          id, user_id, display_name, county, is_verified, status, rating_avg, total_sales, created_at
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', 5.0, 0, ?)
      `).run(
        sellerId,
        params.user.id,
        params.user.displayName,
        params.user.county,
        params.user.isVerified ? 1 : 0,
        now
      );
      seller = { id: sellerId, status: "ACTIVE" };
    }

    const listingId = createId("lst");
    db.prepare(`
      INSERT INTO marketplace_listings (
        id, seller_id, category_id, title, description, price_kes, fulfilment_terms,
        availability, moderation_state, is_featured, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_STOCK', 'APPROVED', 0, ?, ?)
    `).run(
      listingId,
      seller.id,
      category.id,
      title,
      description,
      priceKes,
      fulfilmentTerms,
      now,
      now
    );

    writeAuditLog({
      actorId: params.user.id,
      action: "MARKETPLACE_LISTING_CREATED",
      entityType: "LISTING",
      entityId: listingId,
      details: `${title} (KES ${priceKes})`,
    });

    db.exec("COMMIT");
    return getMarketplaceListingById(listingId)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function listMarketplaceListings(filters?: {
  categorySlug?: string;
  search?: string;
  includeUnapproved?: boolean;
}) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (!filters?.includeUnapproved) {
    conditions.push("ml.moderation_state = 'APPROVED'");
  }
  if (filters?.categorySlug && filters.categorySlug !== "ALL") {
    conditions.push("mc.slug = ?");
    params.push(filters.categorySlug);
  }
  if (filters?.search?.trim()) {
    conditions.push("(ml.title LIKE ? OR ml.description LIKE ? OR sp.display_name LIKE ?)");
    const q = `%${filters.search.trim()}%`;
    params.push(q, q, q);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(`
      SELECT
        ml.*,
        mc.slug as category_slug,
        mc.name as category_name,
        sp.user_id as seller_user_id,
        sp.display_name as seller_display_name,
        sp.county as seller_county,
        sp.is_verified as seller_verified,
        sp.rating_avg as seller_rating,
        u.username as seller_username
      FROM marketplace_listings ml
      JOIN marketplace_categories mc ON mc.id = ml.category_id
      JOIN seller_profiles sp ON sp.id = ml.seller_id
      JOIN users u ON u.id = sp.user_id
      ${whereSql}
      ORDER BY ml.is_featured DESC, ml.created_at DESC
    `)
    .all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    priceKes: Number(r.price_kes),
    fulfilmentTerms: r.fulfilment_terms,
    availability: r.availability,
    moderationState: r.moderation_state,
    isFeatured: Boolean(r.is_featured),
    categorySlug: r.category_slug,
    categoryName: r.category_name,
    sellerId: r.seller_id,
    sellerUserId: r.seller_user_id,
    sellerUsername: r.seller_username,
    sellerDisplayName: r.seller_display_name,
    sellerCounty: r.seller_county,
    sellerVerified: Boolean(r.seller_verified),
    sellerRating: Number(r.seller_rating ?? 5.0),
    createdAt: r.created_at,
  }));
}

export function getMarketplaceListingById(listingId: string) {
  const db = getDb();
  const r = db
    .prepare(`
      SELECT
        ml.*,
        mc.slug as category_slug,
        mc.name as category_name,
        sp.user_id as seller_user_id,
        sp.display_name as seller_display_name,
        sp.county as seller_county,
        sp.is_verified as seller_verified,
        sp.rating_avg as seller_rating,
        sp.total_sales as seller_total_sales,
        u.username as seller_username
      FROM marketplace_listings ml
      JOIN marketplace_categories mc ON mc.id = ml.category_id
      JOIN seller_profiles sp ON sp.id = ml.seller_id
      JOIN users u ON u.id = sp.user_id
      WHERE ml.id = ?
    `)
    .get(listingId) as any;

  if (!r) return null;

  return {
    id: r.id,
    title: r.title,
    description: r.description,
    priceKes: Number(r.price_kes),
    fulfilmentTerms: r.fulfilment_terms,
    availability: r.availability,
    moderationState: r.moderation_state,
    isFeatured: Boolean(r.is_featured),
    categorySlug: r.category_slug,
    categoryName: r.category_name,
    sellerId: r.seller_id,
    sellerUserId: r.seller_user_id,
    sellerUsername: r.seller_username,
    sellerDisplayName: r.seller_display_name,
    sellerCounty: r.seller_county,
    sellerVerified: Boolean(r.seller_verified),
    sellerRating: Number(r.seller_rating ?? 5.0),
    sellerTotalSales: Number(r.seller_total_sales ?? 0),
    createdAt: r.created_at,
  };
}

export function createMarketplaceOrder(params: {
  listingId: string;
  buyer: AuthenticatedUser;
  buyerNotes?: string;
}) {
  const db = getDb();
  const listing = getMarketplaceListingById(params.listingId);
  if (!listing || listing.moderationState !== "APPROVED") {
    throw new Error("Listing is not available for purchase.");
  }
  if (listing.availability === "SOLD_OUT" || listing.availability === "PAUSED") {
    throw new Error("This listing is currently unavailable.");
  }
  if (listing.sellerUserId === params.buyer.id) {
    throw new Error("You cannot place an order on your own listing.");
  }

  const now = new Date().toISOString();
  const orderId = createId("ord");

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO marketplace_orders (
        id, listing_id, buyer_id, seller_id, amount_kes, status, buyer_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(
      orderId,
      listing.id,
      params.buyer.id,
      listing.sellerId,
      listing.priceKes,
      params.buyerNotes?.trim() || null,
      now,
      now
    );

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link_url, created_at)
      VALUES (?, ?, 'ANNOUNCEMENT', ?, ?, ?, ?)
    `).run(
      createId("ntf"),
      listing.sellerUserId,
      `New Marketplace Order: ${listing.title}`,
      `${params.buyer.username} placed an order (KES ${listing.priceKes.toLocaleString()}).`,
      `/marketplace/orders/${orderId}`,
      now
    );

    writeAuditLog({
      actorId: params.buyer.id,
      action: "MARKETPLACE_ORDER_CREATED",
      entityType: "ORDER",
      entityId: orderId,
      details: `${listing.title} (KES ${listing.priceKes})`,
    });

    db.exec("COMMIT");
    return orderId;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function listMarketplaceOrdersForUser(user: AuthenticatedUser) {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        mo.*,
        ml.title as listing_title,
        mc.name as category_name,
        bu.username as buyer_username,
        sp.display_name as seller_display_name,
        sp.user_id as seller_user_id,
        su.username as seller_username
      FROM marketplace_orders mo
      JOIN marketplace_listings ml ON ml.id = mo.listing_id
      JOIN marketplace_categories mc ON mc.id = ml.category_id
      JOIN users bu ON bu.id = mo.buyer_id
      JOIN seller_profiles sp ON sp.id = mo.seller_id
      JOIN users su ON su.id = sp.user_id
      WHERE mo.buyer_id = ? OR sp.user_id = ?
      ORDER BY mo.created_at DESC
    `)
    .all(user.id, user.id) as any[];

  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    categoryName: r.category_name,
    buyerId: r.buyer_id,
    buyerUsername: r.buyer_username,
    sellerId: r.seller_id,
    sellerUserId: r.seller_user_id,
    sellerUsername: r.seller_username,
    sellerDisplayName: r.seller_display_name,
    amountKes: Number(r.amount_kes),
    status: r.status,
    buyerNotes: r.buyer_notes,
    deliveryNotes: r.delivery_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getMarketplaceOrderById(orderId: string, viewer: AuthenticatedUser) {
  const db = getDb();
  const r = db
    .prepare(`
      SELECT
        mo.*,
        ml.title as listing_title,
        ml.fulfilment_terms,
        mc.name as category_name,
        bu.username as buyer_username,
        sp.display_name as seller_display_name,
        sp.user_id as seller_user_id,
        su.username as seller_username
      FROM marketplace_orders mo
      JOIN marketplace_listings ml ON ml.id = mo.listing_id
      JOIN marketplace_categories mc ON mc.id = ml.category_id
      JOIN users bu ON bu.id = mo.buyer_id
      JOIN seller_profiles sp ON sp.id = mo.seller_id
      JOIN users su ON su.id = sp.user_id
      WHERE mo.id = ?
    `)
    .get(orderId) as any;

  if (!r) return null;

  const isParty = r.buyer_id === viewer.id || r.seller_user_id === viewer.id;
  const isAdmin = hasAnyRole(viewer, ["MODERATOR", "SUPER_ADMIN", "FINANCE_ADMIN"]);
  if (!isParty && !isAdmin) {
    throw new Error("Unauthorised to view this order.");
  }

  return {
    id: r.id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    fulfilmentTerms: r.fulfilment_terms,
    categoryName: r.category_name,
    buyerId: r.buyer_id,
    buyerUsername: r.buyer_username,
    sellerId: r.seller_id,
    sellerUserId: r.seller_user_id,
    sellerUsername: r.seller_username,
    sellerDisplayName: r.seller_display_name,
    amountKes: Number(r.amount_kes),
    status: r.status,
    buyerNotes: r.buyer_notes,
    deliveryNotes: r.delivery_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function updateMarketplaceOrderStatus(params: {
  orderId: string;
  actor: AuthenticatedUser;
  nextStatus:
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "DELIVERED"
    | "CONFIRMED"
    | "CANCELLED"
    | "DISPUTED"
    | "REFUNDED";
  deliveryNotes?: string;
}) {
  const db = getDb();
  const order = getMarketplaceOrderById(params.orderId, params.actor);
  if (!order) throw new Error("Order not found.");

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE marketplace_orders
    SET status = ?, delivery_notes = COALESCE(?, delivery_notes), updated_at = ?
    WHERE id = ?
  `).run(params.nextStatus, params.deliveryNotes?.trim() || null, now, order.id);

  if (params.nextStatus === "CONFIRMED") {
    db.prepare(`UPDATE seller_profiles SET total_sales = total_sales + 1 WHERE id = ?`).run(
      order.sellerId
    );
  }

  writeAuditLog({
    actorId: params.actor.id,
    action: `MARKETPLACE_ORDER_${params.nextStatus}`,
    entityType: "ORDER",
    entityId: order.id,
  });

  return getMarketplaceOrderById(order.id, params.actor)!;
}

export function moderateMarketplaceListing(params: {
  listingId: string;
  admin: AuthenticatedUser;
  moderationState: "APPROVED" | "REJECTED" | "REMOVED";
}) {
  if (!hasAnyRole(params.admin, ["MODERATOR", "SUPER_ADMIN"])) {
    throw new Error("Unauthorised: Moderator or Admin permissions required.");
  }
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE marketplace_listings SET moderation_state = ?, updated_at = ? WHERE id = ?
  `).run(params.moderationState, now, params.listingId);

  writeAuditLog({
    actorId: params.admin.id,
    action: `LISTING_MODERATED_${params.moderationState}`,
    entityType: "LISTING",
    entityId: params.listingId,
  });

  return true;
}

// ----------------------------------------------------------------------------
// 2. M-PESA & FINANCIAL INFRASTRUCTURE (Section 18 & 22 Compliance)
// ----------------------------------------------------------------------------

export function getFinanceAndComplianceStatus() {
  const db = getDb();
  const flags = db.prepare(`SELECT * FROM feature_flags ORDER BY key ASC`).all() as any[];
  const accounts = db.prepare(`SELECT * FROM ledger_accounts ORDER BY code ASC`).all() as any[];
  const entries = db
    .prepare(`
      SELECT le.*, la.code as account_code, la.name as account_name
      FROM ledger_entries le
      JOIN ledger_accounts la ON la.id = le.account_id
      ORDER BY le.created_at DESC LIMIT 30
    `)
    .all() as any[];
  const requests = db
    .prepare(`SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT 20`)
    .all() as any[];

  return {
    featureFlags: flags.map((f) => ({
      id: f.id,
      key: f.key,
      enabled: Boolean(f.enabled),
      description: f.description,
      compliance: f.compliance,
      updatedAt: f.updated_at,
    })),
    ledgerAccounts: accounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      accountType: a.account_type,
      currency: a.currency,
      balanceKes: Number(a.balance_kes),
    })),
    ledgerEntries: entries.map((e) => ({
      id: e.id,
      accountCode: e.account_code,
      accountName: e.account_name,
      referenceType: e.reference_type,
      referenceId: e.reference_id,
      direction: e.direction,
      amountKes: Number(e.amount_kes),
      description: e.description,
      createdAt: e.created_at,
    })),
    paymentRequests: requests.map((r) => ({
      id: r.id,
      idempotencyKey: r.idempotency_key,
      userId: r.user_id,
      provider: r.provider,
      purpose: r.purpose,
      referenceId: r.reference_id,
      phoneNumber: r.phone_number,
      amountKes: Number(r.amount_kes),
      status: r.status,
      createdAt: r.created_at,
    })),
  };
}

/**
 * Attempt an M-Pesa STK Push payment request with idempotency key & compliance gate.
 * Section 18 & 35: Never simulate fake payment success in production; enforce compliance gate!
 */
export function createMpesaPaymentRequest(params: {
  user: AuthenticatedUser;
  idempotencyKey: string;
  purpose: "MARKETPLACE_ORDER" | "SPONSORSHIP" | "FUTURE_SUBSCRIPTION";
  referenceId: string;
  phoneNumber: string;
  amountKes: number;
}) {
  const db = getDb();

  // Check idempotency key first
  const existing = db
    .prepare(`SELECT * FROM payment_requests WHERE idempotency_key = ?`)
    .get(params.idempotencyKey) as any;
  if (existing) {
    return {
      id: existing.id,
      idempotencyKey: existing.idempotency_key,
      status: existing.status,
      idempotentReplay: true,
    };
  }

  const mpesaFlag = db
    .prepare(`SELECT enabled FROM feature_flags WHERE key = 'MPESA_PAYMENTS_ENABLED'`)
    .get() as { enabled: number } | undefined;

  const isEnabled = Boolean(mpesaFlag?.enabled) && Boolean(process.env.MPESA_CONSUMER_KEY);
  const status = isEnabled ? "PENDING_PROVIDER" : "DISABLED_BY_COMPLIANCE";
  const id = createId("pay");
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO payment_requests (
      id, idempotency_key, user_id, provider, purpose, reference_id, phone_number, amount_kes, status, created_at
    ) VALUES (?, ?, ?, 'MPESA_DARAJA', ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.idempotencyKey,
    params.user.id,
    params.purpose,
    params.referenceId,
    params.phoneNumber,
    params.amountKes,
    status,
    now
  );

  writeAuditLog({
    actorId: params.user.id,
    action: "PAYMENT_REQUEST_LOGGED",
    entityType: "PAYMENT_REQUEST",
    entityId: id,
    details: `Purpose: ${params.purpose}, Amount: KES ${params.amountKes}, Status: ${status}`,
  });

  return {
    id,
    idempotencyKey: params.idempotencyKey,
    status,
    idempotentReplay: false,
    message:
      status === "DISABLED_BY_COMPLIANCE"
        ? "Regulated M-Pesa payment gateway is currently disabled pending Safaricom Daraja production credentials and legal clearance."
        : "Payment request queued.",
  };
}

// ----------------------------------------------------------------------------
// 3. SPONSORS & CAMPAIGNS (Section 21)
// ----------------------------------------------------------------------------

export function listSponsorsAndCampaigns() {
  const db = getDb();
  const sponsors = db
    .prepare(`SELECT * FROM sponsors WHERE is_active = 1 ORDER BY created_at DESC`)
    .all() as any[];

  const campaigns = db
    .prepare(`
      SELECT sc.*, s.name as sponsor_name, s.tier as sponsor_tier
      FROM sponsorship_campaigns sc
      JOIN sponsors s ON s.id = sc.sponsor_id
      ORDER BY sc.start_date DESC
    `)
    .all() as any[];

  return {
    sponsors: sponsors.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logoUrl: s.logo_url,
      websiteUrl: s.website_url,
      tier: s.tier,
      description: s.description,
    })),
    campaigns: campaigns.map((c) => ({
      id: c.id,
      sponsorId: c.sponsor_id,
      sponsorName: c.sponsor_name,
      sponsorTier: c.sponsor_tier,
      title: c.title,
      placement: c.placement,
      targetUrl: c.target_url,
      impressions: Number(c.impressions),
      clicks: Number(c.clicks),
      startDate: c.start_date,
      endDate: c.end_date,
      status: c.status,
    })),
  };
}

export function createSponsorAndCampaign(params: {
  admin: AuthenticatedUser;
  name: string;
  tier: string;
  description: string;
  websiteUrl?: string;
  campaignTitle: string;
  placement: string;
}) {
  if (!hasAnyRole(params.admin, ["SUPER_ADMIN", "CONTENT_EDITOR", "FINANCE_ADMIN"])) {
    throw new Error("Unauthorised to manage sponsorships.");
  }

  const db = getDb();
  const sponsorId = createId("spn");
  const slug = `${params.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sponsorId.slice(-4)}`;
  const now = new Date().toISOString();
  const end = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO sponsors (id, name, slug, website_url, tier, description, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      sponsorId,
      params.name.trim(),
      slug,
      params.websiteUrl?.trim() || null,
      params.tier,
      params.description.trim(),
      now
    );

    db.prepare(`
      INSERT INTO sponsorship_campaigns (
        id, sponsor_id, title, placement, target_url, impressions, clicks, start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, 'ACTIVE')
    `).run(
      createId("scmp"),
      sponsorId,
      params.campaignTitle.trim(),
      params.placement,
      params.websiteUrl?.trim() || "/sponsors",
      now,
      end
    );

    writeAuditLog({
      actorId: params.admin.id,
      action: "SPONSOR_CREATED",
      entityType: "SPONSOR",
      entityId: sponsorId,
      details: params.name.trim(),
    });

    db.exec("COMMIT");
    return sponsorId;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function recordCampaignEvent(campaignId: string, event: "IMPRESSION" | "CLICK") {
  const db = getDb();
  const col = event === "CLICK" ? "clicks" : "impressions";
  db.prepare(`UPDATE sponsorship_campaigns SET ${col} = ${col} + 1 WHERE id = ?`).run(campaignId);
}

// ----------------------------------------------------------------------------
// 4. ADMIN DASHBOARD OVERVIEW, PLAYER MODERATION & AUDIT LOGS (Section 24)
// ----------------------------------------------------------------------------

export function getAdminDashboardSummary(admin: AuthenticatedUser) {
  if (
    !hasAnyRole(admin, [
      "SUPER_ADMIN",
      "TOURNAMENT_ADMIN",
      "MODERATOR",
      "FINANCE_ADMIN",
      "CONTENT_EDITOR",
    ])
  ) {
    throw new Error("Unauthorised: Administrative role required.");
  }

  const db = getDb();
  const totalUsers = (db.prepare(`SELECT COUNT(*) as cnt FROM users`).get() as { cnt: number }).cnt;
  const activeUsers = (
    db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'ACTIVE'`).get() as { cnt: number }
  ).cnt;
  const activeTournaments = (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM tournaments WHERE status IN ('REGISTRATION_OPEN', 'IN_PROGRESS')`
      )
      .get() as { cnt: number }
  ).cnt;
  const completedTournaments = (
    db.prepare(`SELECT COUNT(*) as cnt FROM tournaments WHERE status = 'COMPLETED'`).get() as {
      cnt: number;
    }
  ).cnt;
  const totalMatches = (
    db.prepare(`SELECT COUNT(*) as cnt FROM tournament_matches`).get() as { cnt: number }
  ).cnt;
  const pendingDisputes = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM disputes WHERE status IN ('OPEN', 'APPEALED')`)
      .get() as { cnt: number }
  ).cnt;
  const activeClans = (db.prepare(`SELECT COUNT(*) as cnt FROM clans`).get() as { cnt: number }).cnt;
  const marketplaceListings = (
    db.prepare(`SELECT COUNT(*) as cnt FROM marketplace_listings`).get() as { cnt: number }
  ).cnt;

  const recentAuditLogs = db
    .prepare(`
      SELECT al.*, u.username as actor_username
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_id
      ORDER BY al.created_at DESC
      LIMIT 30
    `)
    .all() as any[];

  const openDisputes = db
    .prepare(`
      SELECT
        d.*,
        u.username as opened_by_username,
        m.round_label,
        t.title as tournament_title,
        u1.username as player_one_username,
        u2.username as player_two_username
      FROM disputes d
      JOIN users u ON u.id = d.opened_by_id
      JOIN tournament_matches m ON m.id = d.match_id
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users u1 ON u1.id = m.player_one_id
      LEFT JOIN users u2 ON u2.id = m.player_two_id
      ORDER BY
        CASE WHEN d.status IN ('OPEN', 'APPEALED') THEN 0 ELSE 1 END ASC,
        d.created_at DESC
      LIMIT 30
    `)
    .all() as any[];

  const usersList = db
    .prepare(`
      SELECT
        u.id, u.username, u.email, u.status, u.suspension_reason, u.created_at,
        p.display_name, p.county, p.platform, p.is_verified,
        COALESCE(r.rating, 1200) as rating,
        COALESCE(r.matches_played, 0) as matches_played
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN player_ratings r ON r.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 100
    `)
    .all() as any[];

  return {
    metrics: {
      totalUsers: Number(totalUsers),
      activeUsers: Number(activeUsers),
      activeTournaments: Number(activeTournaments),
      completedTournaments: Number(completedTournaments),
      totalMatches: Number(totalMatches),
      pendingDisputes: Number(pendingDisputes),
      activeClans: Number(activeClans),
      marketplaceListings: Number(marketplaceListings),
    },
    auditLogs: recentAuditLogs.map((l) => ({
      id: l.id,
      actorUsername: l.actor_username || "SYSTEM",
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      details: l.details,
      createdAt: l.created_at,
    })),
    disputes: openDisputes.map((d) => ({
      id: d.id,
      matchId: d.match_id,
      tournamentTitle: d.tournament_title || "Friendly Match",
      roundLabel: d.round_label,
      playerOneUsername: d.player_one_username,
      playerTwoUsername: d.player_two_username,
      openedByUsername: d.opened_by_username,
      category: d.category,
      description: d.description,
      status: d.status,
      createdAt: d.created_at,
      resolvedAt: d.resolved_at,
    })),
    users: usersList.map((u) => {
      const roles = db
        .prepare(`SELECT role FROM user_roles WHERE user_id = ?`)
        .all(u.id) as Array<{ role: UserRoleName }>;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.display_name || u.username,
        county: u.county || "Nairobi",
        platform: u.platform || "MOBILE",
        status: u.status,
        suspensionReason: u.suspension_reason,
        isVerified: Boolean(u.is_verified),
        rating: Number(u.rating),
        matchesPlayed: Number(u.matches_played),
        roles: roles.map((r) => r.role),
        createdAt: u.created_at,
      };
    }),
  };
}

export function moderateUserAccount(params: {
  admin: AuthenticatedUser;
  targetUserId: string;
  action: "VERIFY" | "WARN" | "SUSPEND" | "BAN" | "RESTORE" | "GRANT_ROLE";
  reason?: string;
  roleToGrant?: UserRoleName;
}) {
  if (!hasAnyRole(params.admin, ["SUPER_ADMIN", "MODERATOR", "TOURNAMENT_ADMIN"])) {
    throw new Error("Unauthorised to moderate player accounts.");
  }

  const db = getDb();
  const now = new Date().toISOString();

  if (params.action === "VERIFY") {
    db.prepare(`UPDATE profiles SET is_verified = 1, updated_at = ? WHERE user_id = ?`).run(
      now,
      params.targetUserId
    );
  } else if (params.action === "WARN") {
    db.prepare(`UPDATE users SET status = 'WARNED', suspension_reason = ?, updated_at = ? WHERE id = ?`).run(
      params.reason || "Official Fair Play Warning",
      now,
      params.targetUserId
    );
  } else if (params.action === "SUSPEND") {
    db.prepare(`UPDATE users SET status = 'SUSPENDED', suspension_reason = ?, updated_at = ? WHERE id = ?`).run(
      params.reason || "Account suspended by Moderator",
      now,
      params.targetUserId
    );
    revokeAllUserSessions(params.targetUserId);
  } else if (params.action === "BAN") {
    db.prepare(`UPDATE users SET status = 'BANNED', suspension_reason = ?, updated_at = ? WHERE id = ?`).run(
      params.reason || "Permanent Fair Play Violation Ban",
      now,
      params.targetUserId
    );
    revokeAllUserSessions(params.targetUserId);
  } else if (params.action === "RESTORE") {
    db.prepare(`UPDATE users SET status = 'ACTIVE', suspension_reason = NULL, updated_at = ? WHERE id = ?`).run(
      now,
      params.targetUserId
    );
  } else if (params.action === "GRANT_ROLE" && params.roleToGrant) {
    if (!hasAnyRole(params.admin, ["SUPER_ADMIN"])) {
      throw new Error("Only a Super Admin can grant administrative or organiser roles.");
    }
    db.prepare(`
      INSERT OR IGNORE INTO user_roles (id, user_id, role, granted_by, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(createId("role"), params.targetUserId, params.roleToGrant, params.admin.id, now);
  }

  writeAuditLog({
    actorId: params.admin.id,
    action: `USER_MODERATED_${params.action}`,
    entityType: "USER",
    entityId: params.targetUserId,
    details: params.reason || params.roleToGrant || params.action,
  });

  return true;
}
