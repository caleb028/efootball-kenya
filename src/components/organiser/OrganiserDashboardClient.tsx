"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Users,
  Swords,
  FileSpreadsheet,
  Megaphone,
  Play,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface OrganiserDashboardClientProps {
  activeSection?:
    | "overview"
    | "tournaments"
    | "registrations"
    | "fixtures"
    | "reports"
    | "detail";
  selectedTournamentSlug?: string;
}

export function OrganiserDashboardClient({
  activeSection = "overview",
  selectedTournamentSlug,
}: OrganiserDashboardClientProps) {
  const [user, setUser] = useState<any>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadOrganiserData(slugOverride?: string) {
    setLoading(true);
    try {
      const [meRes, tRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/tournaments"),
      ]);
      const meData = await meRes.json();
      const tData = await tRes.json();
      setUser(meData.user || null);
      const list = tData.tournaments || [];
      setTournaments(list);

      const targetSlug = slugOverride || selectedTournamentSlug || list[0]?.slug;
      if (targetSlug) {
        const detailRes = await fetch(`/api/tournaments/${targetSlug}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedTournament(detailData.tournament || null);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganiserData();
  }, [selectedTournamentSlug]);

  async function handleGenerateBracket(slug: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_BRACKET" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate bracket.");
      setFeedback({ type: "ok", text: data.message || "Bracket generated!" });
      await loadOrganiserData(slug);
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTournament) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ANNOUNCEMENT",
          title: announcementTitle,
          content: announcementBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish announcement.");
      setFeedback({ type: "ok", text: "Tournament announcement published to all participants." });
      setAnnouncementTitle("");
      setAnnouncementBody("");
      await loadOrganiserData(selectedTournament.slug);
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  function exportCsv(type: "registrations" | "matches") {
    if (!selectedTournament) return;
    let csvContent = "";
    let filename = "";

    if (type === "registrations") {
      csvContent =
        "Seed,Username,DisplayName,County,Platform,Rating,Status,RegisteredAt\n" +
        (selectedTournament.registrations || [])
          .map(
            (r: any, idx: number) =>
              `${r.seed || idx + 1},${r.username},"${r.displayName}",${r.county},${r.platform},${r.rating},${r.status},${r.registeredAt}`
          )
          .join("\n");
      filename = `${selectedTournament.slug}-registrations.csv`;
    } else {
      csvContent =
        "Round,MatchNumber,PlayerOne,ScoreOne,ScoreTwo,PlayerTwo,Status,ScheduledAt\n" +
        (selectedTournament.matches || [])
          .map(
            (m: any) =>
              `"${m.roundLabel}",${m.matchNumber},${m.playerOneUsername || "TBD"},${m.playerOneScore ?? ""},${m.playerTwoScore ?? ""},${m.playerTwoUsername || "TBD"},${m.status},${m.scheduledAt || ""}`
          )
          .join("\n");
      filename = `${selectedTournament.slug}-fixtures.csv`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const navItems = [
    { id: "overview", label: "Overview", href: "/organiser", icon: Trophy },
    { id: "tournaments", label: "Tournaments", href: "/organiser/tournaments", icon: Calendar },
    { id: "registrations", label: "Registrations", href: "/organiser/registrations", icon: Users },
    { id: "fixtures", label: "Fixtures & Brackets", href: "/organiser/fixtures", icon: Swords },
    { id: "reports", label: "Reports & Exports", href: "/organiser/reports", icon: FileSpreadsheet },
  ];

  const canOrganise =
    user &&
    user.roles?.some((r: string) =>
      ["ORGANISER", "TOURNAMENT_ADMIN", "SUPER_ADMIN"].includes(r)
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="badge-yellow mb-2 inline-block">ORGANISER COMMAND CENTRE</span>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
            Tournament Organiser Hub
          </h1>
          <p className="mt-1 text-sm text-ef-grey">
            Create verified Kenyan eFootball competitions, seed brackets, manage check-ins, and export match reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/organiser/tournaments/new" className="btn-yellow">
            <Plus className="h-4 w-4" /> Create Tournament
          </Link>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="mb-8 flex flex-wrap gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-ef-yellow text-ef-navy shadow-glow-yellow"
                  : "border border-white/10 bg-ef-dark/80 text-white hover:border-ef-blue"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {!user ? (
        <div className="card-esports p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-ef-yellow" />
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Organiser Sign-In Required
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ef-grey">
            Please log in with an account granted Organiser, Tournament Admin, or Super Admin permissions to manage tournaments.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/login" className="btn-yellow">
              Sign In
            </Link>
            <Link href="/tournaments" className="btn-outline">
              Browse Public Tournaments
            </Link>
          </div>
        </div>
      ) : (
        <>
          {!canOrganise && (
            <div className="mb-6 rounded-xl border border-ef-yellow/40 bg-ef-yellow/10 p-4 text-sm text-ef-yellow">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" /> Organiser Role Information
              </div>
              <p className="mt-1 text-white/90">
                Your account currently has roles: <code className="font-mono">{user.roles?.join(", ")}</code>. To create or manage official tournaments, request the <strong>ORGANISER</strong> role from an administrator in the Admin Dashboard.
              </p>
            </div>
          )}

          {feedback && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
                feedback.type === "ok"
                  ? "border-ef-green/40 bg-ef-green/10 text-ef-green"
                  : "border-ef-red/40 bg-ef-red/10 text-ef-red"
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Tournament Selector Bar */}
          {tournaments.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-ef-dark/90 p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-ef-yellow" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-ef-grey">
                    Active Tournament Context
                  </div>
                  <div className="font-display text-lg font-bold text-white">
                    {selectedTournament?.title || "Select a tournament"}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Select Tournament"
                  value={selectedTournament?.slug || ""}
                  onChange={(e) => loadOrganiserData(e.target.value)}
                  className="input-field max-w-xs py-2 text-sm"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
                {selectedTournament && (
                  <Link
                    href={`/tournaments/${selectedTournament.slug}`}
                    className="btn-outline py-2 text-xs"
                  >
                    Public Page <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card-esports h-32 animate-pulse bg-ef-dark/60 p-6" />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="card-esports p-10 text-center">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-ef-yellow" />
              <h3 className="font-display text-2xl font-bold uppercase text-white">
                No Tournaments Created Yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-ef-grey">
                Launch Kenya&apos;s next competitive eFootball cup, county qualifier, or university league season.
              </p>
              <Link href="/organiser/tournaments/new" className="btn-yellow mt-6 inline-flex">
                <Plus className="h-4 w-4" /> Create First Tournament
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Metrics Row */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="card-esports p-5">
                  <div className="text-xs font-semibold uppercase text-ef-grey">Total Tournaments</div>
                  <div className="mt-1 font-display text-3xl font-bold text-white">
                    {tournaments.length}
                  </div>
                </div>
                <div className="card-esports p-5">
                  <div className="text-xs font-semibold uppercase text-ef-grey">
                    Selected Participants
                  </div>
                  <div className="mt-1 font-display text-3xl font-bold text-ef-yellow">
                    {selectedTournament?.confirmedCount || 0}{" "}
                    <span className="text-base font-normal text-ef-grey">
                      / {selectedTournament?.maxParticipants || 0}
                    </span>
                  </div>
                </div>
                <div className="card-esports p-5">
                  <div className="text-xs font-semibold uppercase text-ef-grey">Waitlist Queue</div>
                  <div className="mt-1 font-display text-3xl font-bold text-white">
                    {selectedTournament?.waitlistCount || 0}
                  </div>
                </div>
                <div className="card-esports p-5">
                  <div className="text-xs font-semibold uppercase text-ef-grey">Generated Matches</div>
                  <div className="mt-1 font-display text-3xl font-bold text-ef-green">
                    {selectedTournament?.matches?.length || 0}
                  </div>
                </div>
              </div>

              {/* Tournament List & Controls */}
              {(activeSection === "overview" ||
                activeSection === "tournaments" ||
                activeSection === "detail") &&
                selectedTournament && (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="card-esports p-6 lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                          <span className="badge-blue">{selectedTournament.format}</span>
                          <h2 className="mt-2 font-display text-2xl font-bold uppercase text-white">
                            {selectedTournament.title}
                          </h2>
                          <p className="text-xs text-ef-grey">
                            Platform: {selectedTournament.platform} • County:{" "}
                            {selectedTournament.county || "National"} • Status:{" "}
                            <strong className="text-ef-yellow">{selectedTournament.status}</strong>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTournament.status === "REGISTRATION_OPEN" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleGenerateBracket(selectedTournament.slug)}
                              className="btn-yellow text-xs"
                            >
                              <Play className="h-4 w-4" /> Generate Bracket & Start
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => exportCsv("registrations")}
                            className="btn-outline text-xs"
                          >
                            <FileSpreadsheet className="h-4 w-4" /> Export Players CSV
                          </button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="font-display text-lg font-bold uppercase text-white">
                          All Tournaments Directory
                        </h3>
                        <div className="mt-3 divide-y divide-white/10">
                          {tournaments.map((t) => (
                            <div
                              key={t.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                              <div>
                                <Link
                                  href={`/organiser/tournaments/${t.slug}`}
                                  className="font-semibold text-white hover:text-ef-yellow"
                                >
                                  {t.title}
                                </Link>
                                <div className="text-xs text-ef-grey">
                                  {t.format} • {t.platform} • {t.confirmedCount}/{t.maxParticipants} Players
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="badge-blue">{t.status}</span>
                                <Link
                                  href={`/organiser/tournaments/${t.slug}`}
                                  className="btn-outline px-3 py-1.5 text-xs"
                                >
                                  Manage
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Publish Announcement Box */}
                    <div className="card-esports p-6">
                      <div className="flex items-center gap-2 text-ef-yellow">
                        <Megaphone className="h-5 w-5" />
                        <h3 className="font-display text-lg font-bold uppercase text-white">
                          Official Announcement
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-ef-grey">
                        Notify all confirmed players in {selectedTournament.title}.
                      </p>
                      <form onSubmit={handlePostAnnouncement} className="mt-4 space-y-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                            Headline
                          </label>
                          <input
                            type="text"
                            required
                            value={announcementTitle}
                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                            placeholder="e.g. Round 1 Check-In Opens at 19:00 EAT"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase text-ef-grey">
                            Message
                          </label>
                          <textarea
                            rows={4}
                            required
                            value={announcementBody}
                            onChange={(e) => setAnnouncementBody(e.target.value)}
                            placeholder="Enter lobby instructions, stream links, or fixture deadlines..."
                            className="input-field text-sm"
                          />
                        </div>
                        <button type="submit" disabled={busy} className="btn-primary w-full">
                          Publish Announcement
                        </button>
                      </form>
                    </div>
                  </div>
                )}

              {/* Registrations Table */}
              {(activeSection === "overview" ||
                activeSection === "registrations" ||
                activeSection === "detail") &&
                selectedTournament && (
                  <div className="card-esports p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-bold uppercase text-white">
                          Registered Players & Waitlist ({selectedTournament.registrations?.length || 0})
                        </h3>
                        <p className="text-xs text-ef-grey">
                          Automatic Elo seeding and waitlist auto-promotion are active.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => exportCsv("registrations")}
                        className="btn-outline text-xs"
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Download Roster CSV
                      </button>
                    </div>

                    {selectedTournament.registrations?.length === 0 ? (
                      <p className="py-6 text-center text-sm text-ef-grey">
                        No players have registered for this tournament yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-white/10 text-xs uppercase text-ef-grey">
                            <tr>
                              <th className="py-3 pr-4">Seed</th>
                              <th className="py-3 pr-4">Player</th>
                              <th className="py-3 pr-4">County</th>
                              <th className="py-3 pr-4">Platform</th>
                              <th className="py-3 pr-4">Elo Rating</th>
                              <th className="py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {selectedTournament.registrations?.map((r: any, idx: number) => (
                              <tr key={r.id}>
                                <td className="py-3 pr-4 font-mono text-ef-yellow">
                                  #{r.seed || idx + 1}
                                </td>
                                <td className="py-3 pr-4 font-semibold text-white">
                                  <Link
                                    href={`/players/${r.username}`}
                                    className="hover:text-ef-yellow"
                                  >
                                    {r.displayName} (@{r.username})
                                  </Link>
                                </td>
                                <td className="py-3 pr-4 text-ef-grey">{r.county}</td>
                                <td className="py-3 pr-4 text-ef-grey">{r.platform}</td>
                                <td className="py-3 pr-4 font-display font-bold text-white">
                                  {r.rating}
                                </td>
                                <td className="py-3">
                                  <span
                                    className={
                                      r.status === "CONFIRMED" ? "badge-green" : "badge-yellow"
                                    }
                                  >
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              {/* Fixtures & Brackets */}
              {(activeSection === "overview" ||
                activeSection === "fixtures" ||
                activeSection === "reports" ||
                activeSection === "detail") &&
                selectedTournament && (
                  <div className="card-esports p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-bold uppercase text-white">
                          Tournament Fixtures & Match Rooms ({selectedTournament.matches?.length || 0})
                        </h3>
                        <p className="text-xs text-ef-grey">
                          Inspect live match states, dual-score verification, or jump into any Match Room.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {selectedTournament.status === "REGISTRATION_OPEN" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleGenerateBracket(selectedTournament.slug)}
                            className="btn-yellow text-xs"
                          >
                            <Play className="h-4 w-4" /> Generate Bracket Now
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => exportCsv("matches")}
                          className="btn-outline text-xs"
                        >
                          <FileSpreadsheet className="h-4 w-4" /> Export Fixtures CSV
                        </button>
                      </div>
                    </div>

                    {selectedTournament.matches?.length === 0 ? (
                      <p className="py-6 text-center text-sm text-ef-grey">
                        Fixtures have not been generated yet. Click &ldquo;Generate Bracket &amp; Start&rdquo; once at least 2 players are confirmed.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedTournament.matches?.map((m: any) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-ef-navy/70 p-4"
                          >
                            <div>
                              <div className="text-xs font-semibold uppercase text-ef-yellow">
                                {m.roundLabel} • Match #{m.matchNumber}
                              </div>
                              <div className="mt-1 font-display text-base font-bold text-white">
                                {m.playerOneUsername || "BYE / TBD"}{" "}
                                <span className="mx-2 text-ef-yellow">
                                  {m.playerOneScore !== null && m.playerTwoScore !== null
                                    ? `${m.playerOneScore} - ${m.playerTwoScore}`
                                    : "vs"}
                                </span>{" "}
                                {m.playerTwoUsername || "BYE / TBD"}
                              </div>
                              <div className="mt-1 text-xs text-ef-grey">Status: {m.status}</div>
                            </div>
                            <Link
                              href={`/matches/${m.id}`}
                              className="btn-outline px-3 py-1.5 text-xs"
                            >
                              Match Room
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
