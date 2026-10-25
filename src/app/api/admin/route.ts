import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole, writeAuditLog } from "@/lib/services/auth";
import {
  getAdminDashboardSummary,
  moderateUserAccount,
  moderateMarketplaceListing,
  createSponsorAndCampaign,
  getFinanceAndComplianceStatus,
  listSponsorsAndCampaigns,
  listMarketplaceListings,
} from "@/lib/services/marketplace-finance-admin";
import {
  resolveDisputeByModerator,
  listTournaments,
} from "@/lib/services/tournaments";
import {
  createArticle,
  listArticles,
  listClans,
} from "@/lib/services/clans-community";
import { getLeaderboard } from "@/lib/services/rankings-players";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }
    const summary = getAdminDashboardSummary(user);
    const finance = getFinanceAndComplianceStatus();
    const sponsorsData = listSponsorsAndCampaigns();
    const marketplaceListings = listMarketplaceListings({ includeUnapproved: true });
    const tournaments = listTournaments();
    const clans = listClans();
    const articles = listArticles();
    const rankings = getLeaderboard({ limit: 50 });

    return NextResponse.json({
      ...summary,
      finance,
      sponsorsData,
      marketplaceListings,
      tournaments,
      clans,
      articles,
      rankings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Forbidden." }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "MODERATE_USER") {
      moderateUserAccount({
        admin: user,
        targetUserId: String(body.targetUserId || ""),
        action: body.moderationAction,
        reason: body.reason ? String(body.reason) : undefined,
        roleToGrant: body.roleToGrant,
      });
      return NextResponse.json({ ok: true, message: "Player moderation action applied." });
    }

    if (action === "RESOLVE_DISPUTE") {
      resolveDisputeByModerator({
        disputeId: String(body.disputeId || ""),
        moderator: user,
        ruling: body.ruling,
        playerOneScore:
          body.playerOneScore !== undefined ? Number(body.playerOneScore) : undefined,
        playerTwoScore:
          body.playerTwoScore !== undefined ? Number(body.playerTwoScore) : undefined,
        reasoning: String(body.reasoning || ""),
      });
      return NextResponse.json({
        ok: true,
        message: "Dispute resolved and audit trail recorded.",
      });
    }

    if (action === "MODERATE_LISTING") {
      moderateMarketplaceListing({
        listingId: String(body.listingId || ""),
        admin: user,
        moderationState: body.moderationState,
      });
      return NextResponse.json({ ok: true, message: "Marketplace listing moderated." });
    }

    if (action === "CREATE_ARTICLE") {
      const article = createArticle({
        author: user,
        title: String(body.title || ""),
        excerpt: String(body.excerpt || ""),
        content: String(body.content || ""),
        categorySlug: String(body.categorySlug || "tournament-news"),
        videoEmbed: body.videoEmbed ? String(body.videoEmbed) : undefined,
        isHighlight: Boolean(body.isHighlight),
      });
      return NextResponse.json({ article, message: "Article published!" });
    }

    if (action === "CREATE_SPONSOR") {
      const sponsorId = createSponsorAndCampaign({
        admin: user,
        name: String(body.name || ""),
        tier: String(body.tier || "OFFICIAL_PARTNER"),
        description: String(body.description || ""),
        websiteUrl: body.websiteUrl ? String(body.websiteUrl) : undefined,
        campaignTitle: String(body.campaignTitle || ""),
        placement: String(body.placement || "HOMEPAGE_BANNER"),
      });
      return NextResponse.json({ sponsorId, message: "Sponsor campaign created!" });
    }

    if (action === "TOGGLE_FEATURE_FLAG") {
      if (!hasAnyRole(user, ["SUPER_ADMIN", "FINANCE_ADMIN"])) {
        return NextResponse.json(
          { error: "Only Super Admin or Finance Admin can modify compliance feature flags." },
          { status: 403 }
        );
      }
      const key = String(body.key || "");
      const enabled = Boolean(body.enabled);
      const db = getDb();
      db.prepare(`UPDATE feature_flags SET enabled = ?, updated_at = ? WHERE key = ?`).run(
        enabled ? 1 : 0,
        new Date().toISOString(),
        key
      );
      writeAuditLog({
        actorId: user.id,
        action: "FEATURE_FLAG_UPDATED",
        entityType: "FEATURE_FLAG",
        entityId: key,
        details: `${key} -> ${enabled ? "ENABLED" : "DISABLED"}`,
      });
      return NextResponse.json({
        ok: true,
        message: `Feature flag ${key} updated to ${enabled ? "ENABLED" : "DISABLED"}.`,
      });
    }

    return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
