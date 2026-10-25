"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Trophy,
  Swords,
  Scale,
  Award,
  Shield,
  ShoppingBag,
  Landmark,
  Megaphone,
  Newspaper,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
  Lock,
  Plus,
} from "lucide-react";

export type AdminSection =
  | "overview"
  | "players"
  | "tournaments"
  | "matches"
  | "disputes"
  | "rankings"
  | "clans"
  | "marketplace"
  | "finance"
  | "sponsors"
  | "content"
  | "analytics"
  | "settings";

export function AdminDashboardClient({
  activeSection = "overview",
}: {
  activeSection?: AdminSection;
}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  // Dispute form state
  const [selectedDisputeId, setSelectedDisputeId] = useState("");
  const [ruling, setRuling] = useState("CONFIRM_SCORE");
  const [scoreOne, setScoreOne] = useState(2);
  const [scoreTwo, setScoreTwo] = useState(1);
  const [reasoning, setReasoning] = useState("");

  // Article form state
  const [articleTitle, setArticleTitle] = useState("");
  const [articleExcerpt, setArticleExcerpt] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleCategory, setArticleCategory] = useState("tournament-news");
  const [articleHighlight, setArticleHighlight] = useState(false);

  // Sponsor form state
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorTier, setSponsorTier] = useState("OFFICIAL_PARTNER");
  const [sponsorDesc, setSponsorDesc] = useState("");
  const [sponsorUrl, setSponsorUrl] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignPlacement, setCampaignPlacement] = useState("HOMEPAGE_BANNER");

  async function loadAdmin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Administrative access required.");
      }
      setData(json);
      if (json.disputes?.length > 0 && !selectedDisputeId) {
        const open = json.disputes.find((d: any) =>
          ["OPEN", "APPEALED"].includes(d.status)
        );
        if (open) setSelectedDisputeId(open.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function postAdminAction(payload: Record<string, any>) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed.");
      setFeedback({ type: "ok", text: json.message || "Action applied." });
      await loadAdmin();
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const navItems: Array<{ id: AdminSection; label: string; href: string; icon: any }> = [
    { id: "overview", label: "Overview", href: "/admin", icon: BarChart3 },
    { id: "players", label: "Players & Roles", href: "/admin/players", icon: Users },
    { id: "tournaments", label: "Tournaments", href: "/admin/tournaments", icon: Trophy },
    { id: "matches", label: "Matches", href: "/admin/matches", icon: Swords },
    { id: "disputes", label: "Disputes", href: "/admin/disputes", icon: Scale },
    { id: "rankings", label: "Rankings", href: "/admin/rankings", icon: Award },
    { id: "clans", label: "Clans", href: "/admin/clans", icon: Shield },
    { id: "marketplace", label: "Marketplace", href: "/admin/marketplace", icon: ShoppingBag },
    { id: "finance", label: "Finance & Ledger", href: "/admin/finance", icon: Landmark },
    { id: "sponsors", label: "Sponsors", href: "/admin/sponsors", icon: Megaphone },
    { id: "content", label: "News & Media", href: "/admin/content", icon: Newspaper },
    { id: "analytics", label: "Audit & Analytics", href: "/admin/analytics", icon: BarChart3 },
    { id: "settings", label: "Compliance & Flags", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="badge-yellow mb-2 inline-block">NATIONAL GOVERNANCE & MODERATION</span>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
            eFootball Kenya Administrator Console
          </h1>
          <p className="mt-1 text-sm text-ef-grey">
            Role-based administration, conflict-free dispute adjudication, double-entry ledger inspection, and compliance gates.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/organiser/tournaments/new" className="btn-yellow text-xs">
            <Plus className="h-4 w-4" /> New Tournament
          </Link>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                active
                  ? "bg-ef-yellow text-ef-navy shadow-glow-yellow"
                  : "border border-white/10 bg-ef-dark/80 text-white hover:border-ef-blue"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card-esports h-28 animate-pulse bg-ef-dark/60 p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="card-esports p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-ef-yellow" />
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Administrative Authorisation Required
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ef-grey">{error}</p>
          <p className="mx-auto mt-2 max-w-lg text-xs text-ef-grey">
            Note: In a fresh environment, the very first registered player is automatically granted{" "}
            <strong className="text-ef-yellow">SUPER_ADMIN</strong>,{" "}
            <strong className="text-ef-yellow">MODERATOR</strong>, and{" "}
            <strong className="text-ef-yellow">ORGANISER</strong> roles.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/login" className="btn-yellow">
              Sign In
            </Link>
            <Link href="/register" className="btn-outline">
              Create First Account
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {feedback && (
            <div
              className={`rounded-xl border p-4 text-sm font-medium ${
                feedback.type === "ok"
                  ? "border-ef-green/40 bg-ef-green/10 text-ef-green"
                  : "border-ef-red/40 bg-ef-red/10 text-ef-red"
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* KPI Metrics Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-esports p-5">
              <div className="text-xs font-semibold uppercase text-ef-grey">Registered Players</div>
              <div className="mt-1 font-display text-3xl font-bold text-white">
                {data.metrics.totalUsers}{" "}
                <span className="text-xs font-normal text-ef-green">
                  ({data.metrics.activeUsers} Active)
                </span>
              </div>
            </div>
            <div className="card-esports p-5">
              <div className="text-xs font-semibold uppercase text-ef-grey">Tournaments</div>
              <div className="mt-1 font-display text-3xl font-bold text-ef-yellow">
                {data.metrics.activeTournaments} Active{" "}
                <span className="text-xs font-normal text-ef-grey">
                  / {data.metrics.completedTournaments} Completed
                </span>
              </div>
            </div>
            <div className="card-esports p-5">
              <div className="text-xs font-semibold uppercase text-ef-grey">Pending Disputes</div>
              <div className="mt-1 font-display text-3xl font-bold text-ef-red">
                {data.metrics.pendingDisputes}
              </div>
            </div>
            <div className="card-esports p-5">
              <div className="text-xs font-semibold uppercase text-ef-grey">
                Clans & Marketplace
              </div>
              <div className="mt-1 font-display text-3xl font-bold text-white">
                {data.metrics.activeClans} Clans • {data.metrics.marketplaceListings} Listings
              </div>
            </div>
          </div>

          {/* PLAYERS & ROLES */}
          {(activeSection === "overview" || activeSection === "players") && (
            <div className="card-esports p-6">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Player Accounts, Verification & Role-Based Access Control
              </h2>
              <p className="mt-1 text-xs text-ef-grey">
                Verify Kenyan player profiles, issue Fair Play warnings, suspend/restore accounts, or grant administrative roles.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-ef-grey">
                    <tr>
                      <th className="py-3 pr-4">Player</th>
                      <th className="py-3 pr-4">County / Platform</th>
                      <th className="py-3 pr-4">Elo</th>
                      <th className="py-3 pr-4">Roles</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.users?.map((u: any) => (
                      <tr key={u.id}>
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-white">
                            {u.displayName} (@{u.username})
                          </div>
                          <div className="text-xs text-ef-grey">{u.email}</div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-ef-grey">
                          {u.county} • {u.platform}
                        </td>
                        <td className="py-3 pr-4 font-display font-bold text-ef-yellow">
                          {u.rating}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles?.map((r: string) => (
                              <span key={r} className="badge-blue text-[10px]">
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              u.status === "ACTIVE"
                                ? "badge-green"
                                : u.status === "WARNED"
                                ? "badge-yellow"
                                : "badge-red"
                            }
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {!u.isVerified && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_USER",
                                    targetUserId: u.id,
                                    moderationAction: "VERIFY",
                                  })
                                }
                                className="rounded bg-ef-blue px-2.5 py-1 text-xs font-semibold text-white hover:bg-ef-electric"
                              >
                                Verify
                              </button>
                            )}
                            {!u.roles?.includes("ORGANISER") && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_USER",
                                    targetUserId: u.id,
                                    moderationAction: "GRANT_ROLE",
                                    roleToGrant: "ORGANISER",
                                  })
                                }
                                className="rounded border border-ef-yellow/40 px-2.5 py-1 text-xs font-semibold text-ef-yellow hover:bg-ef-yellow hover:text-ef-navy"
                              >
                                +Organiser
                              </button>
                            )}
                            {!u.roles?.includes("MODERATOR") && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_USER",
                                    targetUserId: u.id,
                                    moderationAction: "GRANT_ROLE",
                                    roleToGrant: "MODERATOR",
                                  })
                                }
                                className="rounded border border-white/20 px-2.5 py-1 text-xs font-semibold text-white hover:border-ef-blue"
                              >
                                +Moderator
                              </button>
                            )}
                            {u.status === "ACTIVE" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_USER",
                                    targetUserId: u.id,
                                    moderationAction: "WARN",
                                    reason: "Fair Play Conduct Warning",
                                  })
                                }
                                className="rounded border border-ef-red/40 px-2.5 py-1 text-xs font-semibold text-ef-red hover:bg-ef-red hover:text-white"
                              >
                                Warn
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_USER",
                                    targetUserId: u.id,
                                    moderationAction: "RESTORE",
                                  })
                                }
                                className="rounded bg-ef-green px-2.5 py-1 text-xs font-semibold text-white"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DISPUTES ADJUDICATION */}
          {(activeSection === "overview" || activeSection === "disputes") && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="card-esports p-6 lg:col-span-2">
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Dispute Queue & Conflict-of-Interest Guard
                </h2>
                <p className="mt-1 text-xs text-ef-grey">
                  Moderators who are participants in a disputed match are automatically blocked from ruling on that match.
                </p>

                {data.disputes?.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ef-grey">
                    Zero match disputes in queue.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.disputes?.map((d: any) => (
                      <div
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-ef-navy/80 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                d.status === "RESOLVED" ? "badge-green" : "badge-red"
                              }
                            >
                              {d.status}
                            </span>
                            <span className="text-xs font-semibold uppercase text-ef-yellow">
                              {d.tournamentTitle} • {d.roundLabel}
                            </span>
                          </div>
                          <div className="mt-1 font-display text-lg font-bold text-white">
                            {d.playerOneUsername || "P1"} vs {d.playerTwoUsername || "P2"}
                          </div>
                          <p className="mt-1 text-xs text-ef-grey">
                            Category: <strong>{d.category}</strong> • Opened by @{d.openedByUsername}: &ldquo;{d.description}&rdquo;
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/matches/${d.matchId}`}
                            className="btn-outline px-3 py-1.5 text-xs"
                          >
                            Inspect Match Room
                          </Link>
                          {d.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => setSelectedDisputeId(d.id)}
                              className="btn-yellow px-3 py-1.5 text-xs"
                            >
                              Adjudicate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-esports p-6">
                <h3 className="font-display text-xl font-bold uppercase text-white">
                  Official Moderator Ruling
                </h3>
                <p className="mt-1 text-xs text-ef-grey">
                  Every ruling is permanently written to the immutable audit trail and triggers Elo & bracket updates.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    postAdminAction({
                      action: "RESOLVE_DISPUTE",
                      disputeId: selectedDisputeId,
                      ruling,
                      playerOneScore: scoreOne,
                      playerTwoScore: scoreTwo,
                      reasoning,
                    });
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                      Dispute ID
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedDisputeId}
                      onChange={(e) => setSelectedDisputeId(e.target.value)}
                      placeholder="Select a dispute from the queue"
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                      Ruling Decision
                    </label>
                    <select
                      value={ruling}
                      onChange={(e) => setRuling(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="CONFIRM_SCORE">CONFIRM_SCORE (Verify Final Score)</option>
                      <option value="FORFEIT_PLAYER_ONE">
                        FORFEIT_PLAYER_ONE (Award 3-0 to Player Two)
                      </option>
                      <option value="FORFEIT_PLAYER_TWO">
                        FORFEIT_PLAYER_TWO (Award 3-0 to Player One)
                      </option>
                      <option value="REPLAY_MATCH">REPLAY_MATCH (Reset Match for Replay)</option>
                    </select>
                  </div>
                  {ruling === "CONFIRM_SCORE" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                          Player 1 Score
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={scoreOne}
                          onChange={(e) => setScoreOne(Number(e.target.value))}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                          Player 2 Score
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={scoreTwo}
                          onChange={(e) => setScoreTwo(Number(e.target.value))}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                      Official Reasoning
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      placeholder="Document evidence verification for both players..."
                      className="input-field text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !selectedDisputeId}
                    className="btn-yellow w-full"
                  >
                    Submit Official Ruling
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TOURNAMENTS & MATCHES */}
          {(activeSection === "tournaments" || activeSection === "matches") && (
            <div className="card-esports p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  All Platform Tournaments & Match Governance ({data.tournaments?.length || 0})
                </h2>
                <Link href="/organiser" className="btn-outline text-xs">
                  Open Organiser Hub
                </Link>
              </div>
              <div className="mt-4 divide-y divide-white/10">
                {data.tournaments?.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3"
                  >
                    <div>
                      <div className="font-display text-lg font-bold text-white">
                        {t.title}
                      </div>
                      <div className="text-xs text-ef-grey">
                        {t.format} • {t.platform} • {t.confirmedCount}/{t.maxParticipants} Players • Status: {t.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/organiser/tournaments/${t.slug}`}
                        className="btn-yellow px-3 py-1.5 text-xs"
                      >
                        Manage Bracket & Fixtures
                      </Link>
                      <Link
                        href={`/tournaments/${t.slug}`}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        Public View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RANKINGS & CLANS */}
          {(activeSection === "rankings" || activeSection === "clans") && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card-esports p-6">
                <h2 className="font-display text-xl font-bold uppercase text-white">
                  National Elo Leaderboard Snapshot
                </h2>
                <div className="mt-4 divide-y divide-white/10">
                  {data.rankings?.slice(0, 10).map((r: any) => (
                    <div key={r.userId} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="mr-2 font-mono text-ef-yellow">#{r.rank}</span>
                        <span className="font-semibold text-white">{r.displayName}</span>
                        <span className="ml-2 text-xs text-ef-grey">({r.county})</span>
                      </div>
                      <div className="font-display font-bold text-ef-yellow">{r.rating} PTS</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-esports p-6">
                <h2 className="font-display text-xl font-bold uppercase text-white">
                  Registered Kenyan Clans ({data.clans?.length || 0})
                </h2>
                <div className="mt-4 divide-y divide-white/10">
                  {data.clans?.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="badge-yellow mr-2">[{c.tag}]</span>
                        <Link href={`/clans/${c.slug}`} className="font-semibold text-white hover:text-ef-yellow">
                          {c.name}
                        </Link>
                        <span className="ml-2 text-xs text-ef-grey">• {c.county}</span>
                      </div>
                      <span className="text-xs text-ef-grey">
                        {c.memberCount} Members • {c.rating} Elo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MARKETPLACE MODERATION */}
          {(activeSection === "overview" || activeSection === "marketplace") && (
            <div className="card-esports p-6">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Marketplace Moderation & Permitted Categories Enforcement
              </h2>
              <p className="mt-1 text-xs text-ef-grey">
                Account sales, coin generators, and gambling items are automatically blocked at creation. Moderators can approve, reject, or remove listings below.
              </p>
              {data.marketplaceListings?.length === 0 ? (
                <p className="py-6 text-center text-sm text-ef-grey">
                  No marketplace listings submitted yet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase text-ef-grey">
                      <tr>
                        <th className="py-3 pr-4">Listing</th>
                        <th className="py-3 pr-4">Category</th>
                        <th className="py-3 pr-4">Seller</th>
                        <th className="py-3 pr-4">Price (KES)</th>
                        <th className="py-3 pr-4">State</th>
                        <th className="py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.marketplaceListings?.map((l: any) => (
                        <tr key={l.id}>
                          <td className="py-3 pr-4 font-semibold text-white">{l.title}</td>
                          <td className="py-3 pr-4 text-xs text-ef-grey">{l.categoryName}</td>
                          <td className="py-3 pr-4 text-xs text-ef-grey">
                            {l.sellerDisplayName} (@{l.sellerUsername})
                          </td>
                          <td className="py-3 pr-4 font-display font-bold text-ef-yellow">
                            KES {l.priceKes.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={
                                l.moderationState === "APPROVED"
                                  ? "badge-green"
                                  : "badge-red"
                              }
                            >
                              {l.moderationState}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_LISTING",
                                    listingId: l.id,
                                    moderationState: "APPROVED",
                                  })
                                }
                                className="rounded bg-ef-green px-2.5 py-1 text-xs font-semibold text-white"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  postAdminAction({
                                    action: "MODERATE_LISTING",
                                    listingId: l.id,
                                    moderationState: "REMOVED",
                                  })
                                }
                                className="rounded bg-ef-red px-2.5 py-1 text-xs font-semibold text-white"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* FINANCE, DOUBLE-ENTRY LEDGER & COMPLIANCE FLAGS */}
          {(activeSection === "overview" ||
            activeSection === "finance" ||
            activeSection === "settings") && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card-esports p-6">
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Compliance Feature Flags (Section 18 & 22)
                </h2>
                <p className="mt-1 text-xs text-ef-grey">
                  Regulated M-Pesa Daraja payment flows and paid entry fees remain safely gated until legal clearance and Safaricom production credentials are configured.
                </p>
                <div className="mt-4 space-y-3">
                  {data.finance?.featureFlags?.map((f: any) => (
                    <div
                      key={f.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-ef-navy/70 p-4"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-ef-yellow">
                          {f.key}
                        </div>
                        <div className="mt-0.5 text-xs text-white">{f.description}</div>
                        <div className="mt-1 text-[11px] text-ef-grey">
                          Compliance Requirement: {f.compliance}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          postAdminAction({
                            action: "TOGGLE_FEATURE_FLAG",
                            key: f.key,
                            enabled: !f.enabled,
                          })
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition ${
                          f.enabled
                            ? "bg-ef-green text-white"
                            : "border border-white/20 bg-ef-dark text-ef-grey hover:text-white"
                        }`}
                      >
                        {f.enabled ? "ENABLED" : "DISABLED"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-esports p-6">
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Double-Entry KES Ledger Accounts
                </h2>
                <p className="mt-1 text-xs text-ef-grey">
                  Auditable chart of accounts in Kenyan Shillings (KES). No fabricated transactions are ever generated.
                </p>
                <div className="mt-4 space-y-3">
                  {data.finance?.ledgerAccounts?.map((a: any) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-ef-navy/70 p-3.5"
                    >
                      <div>
                        <div className="font-mono text-xs text-ef-yellow">{a.code}</div>
                        <div className="font-semibold text-white">{a.name}</div>
                        <div className="text-xs text-ef-grey">Type: {a.accountType}</div>
                      </div>
                      <div className="font-display text-xl font-bold text-white">
                        KES {a.balanceKes.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SPONSORS & CAMPAIGNS */}
          {(activeSection === "sponsors" || activeSection === "content") && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card-esports p-6">
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Launch Sponsor Campaign
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    postAdminAction({
                      action: "CREATE_SPONSOR",
                      name: sponsorName,
                      tier: sponsorTier,
                      description: sponsorDesc,
                      websiteUrl: sponsorUrl,
                      campaignTitle,
                      placement: campaignPlacement,
                    });
                    setSponsorName("");
                    setSponsorDesc("");
                    setCampaignTitle("");
                  }}
                  className="mt-4 space-y-3"
                >
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="Sponsor Brand Name"
                    className="input-field text-sm"
                  />
                  <select
                    value={sponsorTier}
                    onChange={(e) => setSponsorTier(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="TITLE_SPONSOR">TITLE_SPONSOR</option>
                    <option value="OFFICIAL_PARTNER">OFFICIAL_PARTNER</option>
                    <option value="COMMUNITY_SUPPORTER">COMMUNITY_SUPPORTER</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Campaign Banner Headline"
                    className="input-field text-sm"
                  />
                  <textarea
                    rows={2}
                    required
                    value={sponsorDesc}
                    onChange={(e) => setSponsorDesc(e.target.value)}
                    placeholder="Sponsor overview and community partnership details..."
                    className="input-field text-sm"
                  />
                  <button type="submit" disabled={busy} className="btn-yellow w-full">
                    Publish Sponsor Campaign
                  </button>
                </form>
              </div>

              <div className="card-esports p-6">
                <h2 className="font-display text-2xl font-bold uppercase text-white">
                  Publish News or Match Highlight
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    postAdminAction({
                      action: "CREATE_ARTICLE",
                      title: articleTitle,
                      excerpt: articleExcerpt,
                      content: articleContent,
                      categorySlug: articleCategory,
                      isHighlight: articleHighlight,
                    });
                    setArticleTitle("");
                    setArticleExcerpt("");
                    setArticleContent("");
                  }}
                  className="mt-4 space-y-3"
                >
                  <input
                    type="text"
                    required
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    placeholder="Article Headline"
                    className="input-field text-sm"
                  />
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="tournament-news">Tournament News</option>
                    <option value="match-reports">Match Reports</option>
                    <option value="player-interviews">Player Interviews</option>
                    <option value="patch-notes">eFootball Updates & Patch Notes</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={articleExcerpt}
                    onChange={(e) => setArticleExcerpt(e.target.value)}
                    placeholder="Brief summary excerpt..."
                    className="input-field text-sm"
                  />
                  <textarea
                    rows={3}
                    required
                    value={articleContent}
                    onChange={(e) => setArticleContent(e.target.value)}
                    placeholder="Full editorial article content..."
                    className="input-field text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs text-ef-grey">
                    <input
                      type="checkbox"
                      checked={articleHighlight}
                      onChange={(e) => setArticleHighlight(e.target.checked)}
                    />
                    Feature in Match Highlights & Livestreams Hub
                  </label>
                  <button type="submit" disabled={busy} className="btn-primary w-full">
                    Publish Editorial Article
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* IMMUTABLE AUDIT LOGS */}
          {(activeSection === "overview" || activeSection === "analytics") && (
            <div className="card-esports p-6">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Immutable Security & Moderation Audit Trail
              </h2>
              <p className="mt-1 text-xs text-ef-grey">
                Every authentication event, tournament creation, bracket seed, score verification, dispute ruling, and moderation action is logged.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 uppercase text-ef-grey">
                    <tr>
                      <th className="py-2.5 pr-4">Timestamp</th>
                      <th className="py-2.5 pr-4">Actor</th>
                      <th className="py-2.5 pr-4">Action</th>
                      <th className="py-2.5 pr-4">Entity</th>
                      <th className="py-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {data.auditLogs?.map((log: any) => (
                      <tr key={log.id}>
                        <td className="py-2.5 pr-4 text-ef-grey">
                          {new Date(log.createdAt).toLocaleString("en-KE")}
                        </td>
                        <td className="py-2.5 pr-4 text-ef-yellow">@{log.actorUsername}</td>
                        <td className="py-2.5 pr-4 font-bold text-white">{log.action}</td>
                        <td className="py-2.5 pr-4 text-ef-grey">
                          {log.entityType}:{log.entityId}
                        </td>
                        <td className="py-2.5 text-white/80">{log.details || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
