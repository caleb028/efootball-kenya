"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  Swords,
  ShieldCheck,
  Award,
  Megaphone,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface TournamentDetailClientProps {
  tournament: any;
  currentUser: any | null;
  initialTab?: string;
}

export function TournamentDetailClient({
  tournament: initialTournament,
  currentUser,
  initialTab = "OVERVIEW",
}: TournamentDetailClientProps) {
  const router = useRouter();
  const [tournament, setTournament] = useState(initialTournament);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  const isRegistered =
    currentUser &&
    tournament.participants.some((p: any) => p.userId === currentUser.id);
  const isWaitlisted =
    currentUser &&
    tournament.waitlist.some((p: any) => p.userId === currentUser.id);

  const canManage =
    currentUser &&
    (currentUser.id === tournament.organiserId ||
      currentUser.roles?.includes("TOURNAMENT_ADMIN") ||
      currentUser.roles?.includes("SUPER_ADMIN"));

  async function refreshTournament() {
    const res = await fetch(`/api/tournaments/${tournament.slug}`);
    if (res.ok) {
      const data = await res.json();
      setTournament(data.tournament);
    }
  }

  async function handleAction(action: "REGISTER" | "WITHDRAW" | "GENERATE_BRACKET") {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Action failed." });
      } else {
        setFeedback({ type: "ok", text: data.message || "Success!" });
        await refreshTournament();
        router.refresh();
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ANNOUNCEMENT",
          title: annTitle,
          content: annContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed to post announcement." });
      } else {
        setAnnTitle("");
        setAnnContent("");
        setFeedback({ type: "ok", text: "Announcement published!" });
        await refreshTournament();
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  // Group knockout matches by roundLabel for interactive bracket rendering
  const roundMap = new Map<string, any[]>();
  for (const m of tournament.matches) {
    if (!roundMap.has(m.roundLabel)) {
      roundMap.set(m.roundLabel, []);
    }
    roundMap.get(m.roundLabel)!.push(m);
  }
  const roundsList = Array.from(roundMap.entries());

  const tabs = [
    { id: "OVERVIEW", label: "Overview" },
    { id: "PARTICIPANTS", label: `Participants (${tournament.registeredCount})` },
    { id: "BRACKET", label: "Bracket & Standings" },
    { id: "FIXTURES", label: `Fixtures (${tournament.matches.length})` },
    {
      id: "RESULTS",
      label: `Results (${
        tournament.matches.filter(
          (m: any) => m.status === "COMPLETED" || m.status === "WALKOVER"
        ).length
      })`,
    },
    { id: "RULES", label: "Rules" },
    { id: "PRIZES", label: "Prizes" },
    { id: "ANNOUNCEMENTS", label: `Announcements (${tournament.announcements.length})` },
  ];

  const isOpen =
    tournament.status === "REGISTRATION_OPEN" || tournament.status === "PUBLISHED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tournament Broadcast Header */}
      <div className="bg-gradient-to-r from-brand-royal via-brand-darkBlue to-brand-navy border-2 border-brand-royal rounded-2xl p-6 sm:p-8 shadow-esports-blue">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="esports-badge-yellow">
                {(tournament.status || "PUBLISHED").replace(/_/g, " ")}
              </span>
              <span className="esports-badge-blue">{tournament.platform || "ALL"}</span>
              <span className="esports-badge-blue">
                {(tournament.format || "SINGLE_ELIMINATION").replace(/_/g, " ")}
              </span>
              <span className="text-xs text-brand-grey font-semibold">
                Region: {tournament.region}
              </span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-5xl uppercase text-white leading-tight">
              {tournament.title}
            </h1>

            <p className="text-sm text-white/85 max-w-3xl">{tournament.description}</p>

            {tournament.winnerUsername && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold/20 border border-brand-gold text-brand-yellow font-display font-bold text-base">
                <Trophy className="w-5 h-5 text-brand-gold" />
                Tournament Champion: {tournament.winnerUsername}
              </div>
            )}
          </div>

          {/* Registration & Organiser Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 min-w-[240px]">
            {!currentUser ? (
              <Link href="/login" className="btn-yellow w-full text-center">
                Sign In to Register
              </Link>
            ) : isRegistered || isWaitlisted ? (
              <div className="space-y-2">
                <div className="px-4 py-2.5 rounded-lg bg-brand-success/20 border border-brand-success text-xs font-bold text-white flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-success" />
                  {isRegistered ? "Registered (Confirmed Slot)" : "On Official Waitlist"}
                </div>
                {isOpen && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("WITHDRAW")}
                    className="btn-outline w-full text-xs py-2"
                  >
                    Withdraw Registration
                  </button>
                )}
              </div>
            ) : (
              isOpen && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction("REGISTER")}
                  className="btn-yellow w-full py-3"
                >
                  <Trophy className="w-4 h-4" />
                  {tournament.registeredCount >= tournament.maxParticipants
                    ? "Join Official Waitlist"
                    : "Register for Tournament"}
                </button>
              )
            )}

            {canManage && tournament.participants.length >= 2 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("GENERATE_BRACKET")}
                className="btn-royal w-full text-xs py-2.5"
              >
                <Play className="w-4 h-4 text-brand-yellow" />
                {tournament.matches.length > 0
                  ? "Regenerate Bracket & Fixtures"
                  : "Generate Bracket & Start"}
              </button>
            )}

            <button
              type="button"
              onClick={refreshTournament}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-brand-grey hover:text-brand-yellow py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Real-Time Status
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-5 p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
              feedback.type === "ok"
                ? "bg-brand-success/20 border-brand-success text-white"
                : "bg-brand-error/20 border-brand-error text-white"
            }`}
          >
            {feedback.type === "ok" ? (
              <CheckCircle2 className="w-4 h-4 text-brand-success shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-brand-error shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Tournament Navigation Tabs (Section 9) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-royal/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg font-display font-bold uppercase tracking-wider text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-brand-yellow text-brand-navy shadow-esports-yellow"
                : "bg-brand-darkBlue text-white/85 hover:text-white border border-brand-royal/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="esports-card p-6 space-y-4">
              <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                Competition Overview
              </h2>
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">
                {tournament.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-brand-royal/30">
                <div className="bg-brand-navy p-3.5 rounded-lg border border-brand-royal/40">
                  <div className="text-xs text-brand-grey">Confirmed Slots</div>
                  <div className="font-display font-bold text-2xl text-brand-yellow">
                    {tournament.registeredCount} / {tournament.maxParticipants}
                  </div>
                </div>
                <div className="bg-brand-navy p-3.5 rounded-lg border border-brand-royal/40">
                  <div className="text-xs text-brand-grey">Waitlist</div>
                  <div className="font-display font-bold text-2xl text-white">
                    {tournament.waitlistCount}
                  </div>
                </div>
                <div className="bg-brand-navy p-3.5 rounded-lg border border-brand-royal/40">
                  <div className="text-xs text-brand-grey">Seeding Mode</div>
                  <div className="font-display font-bold text-2xl text-white">
                    {tournament.seedingMode}
                  </div>
                </div>
                <div className="bg-brand-navy p-3.5 rounded-lg border border-brand-royal/40">
                  <div className="text-xs text-brand-grey">Match Duration</div>
                  <div className="font-display font-bold text-2xl text-white">
                    {tournament.rules?.matchDurationMins || 10} Mins
                  </div>
                </div>
              </div>
            </div>

            {/* Authorised Livestream Embed if configured (Section 20) */}
            {tournament.livestreamUrl && (
              <div className="esports-card p-6 space-y-4">
                <h3 className="font-display font-bold text-xl uppercase text-brand-yellow">
                  Official Tournament Livestream
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden bg-brand-navy border border-brand-royal">
                  <iframe
                    src={tournament.livestreamUrl}
                    title={tournament.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="esports-card p-6 space-y-3 text-xs">
              <h3 className="font-display font-bold text-xl uppercase text-white mb-2">
                Schedule & Eligibility
              </h3>
              <div className="flex justify-between py-2 border-b border-brand-royal/30">
                <span className="text-brand-grey">Organiser:</span>
                <span className="text-white font-bold">{tournament.organiserUsername}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-royal/30">
                <span className="text-brand-grey">Registration Deadline:</span>
                <span className="text-white font-semibold">
                  {new Date(tournament.registrationDeadline).toLocaleString("en-KE")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-royal/30">
                <span className="text-brand-grey">Tournament Start:</span>
                <span className="text-brand-yellow font-bold">
                  {new Date(tournament.startDate).toLocaleString("en-KE")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-royal/30">
                <span className="text-brand-grey">Entry Policy:</span>
                <span className="text-white font-semibold">{tournament.entryRequirement}</span>
              </div>
              {tournament.sponsorName && (
                <div className="flex justify-between py-2">
                  <span className="text-brand-grey">Official Sponsor:</span>
                  <span className="text-brand-yellow font-bold">{tournament.sponsorName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === "PARTICIPANTS" && (
        <div className="space-y-6">
          <div className="esports-card overflow-hidden">
            <div className="p-4 bg-brand-navy border-b border-brand-royal/50 flex items-center justify-between">
              <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
                Confirmed Participants ({tournament.participants.length} /{" "}
                {tournament.maxParticipants})
              </h2>
            </div>
            {tournament.participants.length === 0 ? (
              <div className="p-8 text-center text-sm text-brand-grey">
                No players have registered yet. Click &ldquo;Register for Tournament&rdquo; above
                to claim the first slot!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-brand-navy/60 border-b border-brand-royal/40 text-xs font-display uppercase text-brand-grey">
                      <th className="py-3 px-4">Seed / #</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">County</th>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4 text-right">Elo Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-royal/25">
                    {tournament.participants.map((p: any, idx: number) => (
                      <tr key={p.userId} className="hover:bg-brand-royal/15">
                        <td className="py-3 px-4 font-display font-bold text-brand-yellow">
                          #{p.seed ?? idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <Link
                            href={`/players/${p.username}`}
                            className="hover:text-brand-yellow"
                          >
                            {p.username}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-brand-grey">{p.county}</td>
                        <td className="py-3 px-4 text-xs text-white">{p.platform}</td>
                        <td className="py-3 px-4 text-right font-display font-bold text-brand-yellow">
                          {p.rating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {tournament.waitlist.length > 0 && (
            <div className="esports-card p-5 space-y-3">
              <h3 className="font-display font-bold text-lg uppercase text-white">
                Official Waitlist ({tournament.waitlist.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {tournament.waitlist.map((w: any, i: number) => (
                  <span
                    key={w.userId}
                    className="px-3 py-1.5 rounded-lg bg-brand-navy border border-brand-royal/40 text-xs text-white"
                  >
                    #{i + 1} {w.username} ({w.rating} ELO)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERACTIVE BRACKET & STANDINGS (Section 10) */}
      {activeTab === "BRACKET" && (
        <div className="space-y-8">
          {/* Standings Table for Round Robin / League / Group Stage */}
          {tournament.standings &&
            tournament.standings.length > 0 &&
            (tournament.format === "ROUND_ROBIN" ||
              tournament.format === "LEAGUE_SEASON" ||
              tournament.format === "GROUP_PLUS_KNOCKOUT") && (
              <div className="esports-card overflow-hidden">
                <div className="p-4 bg-brand-navy border-b border-brand-royal/50">
                  <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
                    Official Standings Table (Points & Goal Difference)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-brand-navy/70 border-b border-brand-royal/40 text-xs font-display uppercase text-brand-yellow">
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-4 text-center">P</th>
                        <th className="py-3 px-4 text-center">W</th>
                        <th className="py-3 px-4 text-center">D</th>
                        <th className="py-3 px-4 text-center">L</th>
                        <th className="py-3 px-4 text-center">GF</th>
                        <th className="py-3 px-4 text-center">GA</th>
                        <th className="py-3 px-4 text-center">GD</th>
                        <th className="py-3 px-4 text-right">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-royal/25">
                      {tournament.standings.map((row: any, idx: number) => (
                        <tr key={row.userId} className="hover:bg-brand-royal/15">
                          <td className="py-3 px-4 font-display font-bold text-brand-yellow">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            <Link
                              href={`/players/${row.username}`}
                              className="hover:text-brand-yellow"
                            >
                              {row.username}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-center">{row.played}</td>
                          <td className="py-3 px-4 text-center text-brand-success font-bold">
                            {row.wins}
                          </td>
                          <td className="py-3 px-4 text-center">{row.draws}</td>
                          <td className="py-3 px-4 text-center text-brand-error">{row.losses}</td>
                          <td className="py-3 px-4 text-center">{row.goalsFor}</td>
                          <td className="py-3 px-4 text-center">{row.goalsAgainst}</td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {row.goalDifference > 0
                              ? `+${row.goalDifference}`
                              : row.goalDifference}
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold text-lg text-brand-yellow">
                            {row.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Interactive Broadcast Bracket */}
          <div className="bg-brand-navy border-2 border-brand-royal rounded-2xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-royal/40 pb-4">
              <div>
                <span className="esports-badge-yellow">Broadcast View</span>
                <h2 className="font-display font-bold text-2xl uppercase text-white mt-1">
                  Interactive Tournament Bracket
                </h2>
              </div>

              {/* Mobile & Desktop Zoom Controls (Section 10) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
                  className="p-2 rounded-lg bg-brand-darkBlue border border-brand-royal text-white hover:border-brand-yellow"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-brand-yellow px-2">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
                  className="p-2 rounded-lg bg-brand-darkBlue border border-brand-royal text-white hover:border-brand-yellow"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="p-2 rounded-lg bg-brand-darkBlue border border-brand-royal text-brand-grey hover:text-white"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {roundsList.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Swords className="w-10 h-10 text-brand-yellow mx-auto" />
                <h3 className="font-display font-bold text-xl uppercase text-white">
                  Bracket Not Generated Yet
                </h3>
                <p className="text-xs text-brand-grey max-w-md mx-auto">
                  Once at least 2 players are confirmed, the Organiser or Tournament Admin can
                  click &ldquo;Generate Bracket & Start&rdquo; to build the automated matchups.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <div
                  className="flex items-stretch gap-8 min-w-max transition-transform origin-top-left"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {roundsList.map(([roundLabel, roundMatches]) => (
                    <div key={roundLabel} className="w-72 flex flex-col gap-4">
                      <div className="px-3.5 py-2 rounded-lg bg-brand-royal text-center font-display font-bold uppercase tracking-wider text-sm text-brand-yellow border border-white/15">
                        {roundLabel}
                      </div>

                      <div className="flex flex-col justify-around flex-1 gap-4">
                        {roundMatches.map((m: any) => {
                          const p1Won = m.winnerId && m.winnerId === m.playerOneId;
                          const p2Won = m.winnerId && m.winnerId === m.playerTwoId;

                          return (
                            <Link
                              key={m.id}
                              href={`/matches/${m.id}`}
                              className="block bg-brand-darkBlue border-2 border-brand-royal/70 hover:border-brand-yellow rounded-xl p-3.5 shadow-esports-card transition-all space-y-2.5"
                            >
                              <div className="flex items-center justify-between text-[11px] text-brand-grey">
                                <span>Match #{m.matchNumber}</span>
                                <span
                                  className={`font-display font-bold uppercase px-1.5 py-0.5 rounded ${
                                    m.status === "COMPLETED"
                                      ? "bg-brand-success/20 text-brand-success"
                                      : m.status === "DISPUTED"
                                      ? "bg-brand-error/20 text-brand-error"
                                      : "bg-brand-navy text-brand-yellow"
                                  }`}
                                >
                                  {(m.status || "PENDING").replace(/_/g, " ")}
                                </span>
                              </div>

                              {/* Player 1 Slot */}
                              <div
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                  p1Won
                                    ? "bg-brand-royal/40 border-brand-yellow text-brand-yellow font-bold"
                                    : "bg-brand-navy/90 border-brand-royal/30 text-white"
                                }`}
                              >
                                <span className="truncate text-sm">
                                  {m.playerOneUsername || "TBD / Bye"}
                                </span>
                                <span className="font-display font-bold text-base ml-2">
                                  {m.playerOneScore ?? "-"}
                                </span>
                              </div>

                              {/* Player 2 Slot */}
                              <div
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                                  p2Won
                                    ? "bg-brand-royal/40 border-brand-yellow text-brand-yellow font-bold"
                                    : "bg-brand-navy/90 border-brand-royal/30 text-white"
                                }`}
                              >
                                <span className="truncate text-sm">
                                  {m.playerTwoUsername || "TBD / Bye"}
                                </span>
                                <span className="font-display font-bold text-base ml-2">
                                  {m.playerTwoScore ?? "-"}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FIXTURES */}
      {activeTab === "FIXTURES" && (
        <div className="space-y-4">
          {tournament.matches.length === 0 ? (
            <div className="esports-card p-8 text-center text-sm text-brand-grey">
              No fixtures generated yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournament.matches.map((m: any) => (
                <div
                  key={m.id}
                  className="esports-card p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-brand-yellow font-display font-bold uppercase">
                      {m.roundLabel} • Match #{m.matchNumber}
                    </div>
                    <div className="font-bold text-white text-base">
                      {m.playerOneUsername || "TBD"}{" "}
                      <span className="text-brand-yellow px-1">
                        {m.playerOneScore !== null && m.playerTwoScore !== null
                          ? `${m.playerOneScore} - ${m.playerTwoScore}`
                          : "vs"}
                      </span>{" "}
                      {m.playerTwoUsername || "TBD"}
                    </div>
                    <div className="text-xs text-brand-grey">
                      Scheduled: {new Date(m.scheduledAt).toLocaleString("en-KE")}
                    </div>
                  </div>
                  <Link href={`/matches/${m.id}`} className="btn-royal text-xs py-2 px-3.5 shrink-0">
                    Match Room
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: VERIFIED RESULTS */}
      {activeTab === "RESULTS" && (
        <div className="space-y-4">
          {tournament.matches.filter(
            (m: any) => m.status === "COMPLETED" || m.status === "WALKOVER"
          ).length === 0 ? (
            <div className="esports-card p-8 text-center text-sm text-brand-grey">
              No verified match results completed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournament.matches
                .filter((m: any) => m.status === "COMPLETED" || m.status === "WALKOVER")
                .map((m: any) => (
                  <div
                    key={m.id}
                    className="esports-card p-4 flex items-center justify-between gap-4 border-brand-success/40"
                  >
                    <div>
                      <span className="text-xs font-display font-bold uppercase text-brand-success">
                        Verified • {m.roundLabel}
                      </span>
                      <div className="font-bold text-white text-lg mt-0.5">
                        {m.playerOneUsername || "Bye"}{" "}
                        <span className="text-brand-yellow font-display px-1.5">
                          {m.playerOneScore} : {m.playerTwoScore}
                        </span>{" "}
                        {m.playerTwoUsername || "Bye"}
                      </div>
                    </div>
                    <Link href={`/matches/${m.id}`} className="btn-outline text-xs py-1.5 px-3">
                      Details
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RULES */}
      {activeTab === "RULES" && (
        <div className="esports-card p-6 space-y-5">
          <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
            Official Match & Dispute Rules
          </h2>
          <div className="text-sm text-white/90 whitespace-pre-line leading-relaxed">
            {tournament.rules?.rulesContent}
          </div>
          <div className="pt-4 border-t border-brand-royal/30">
            <h3 className="font-display font-bold text-lg uppercase text-white mb-1">
              Dispute & Evidence Policy
            </h3>
            <p className="text-xs text-brand-grey whitespace-pre-line">
              {tournament.rules?.disputePolicy}
            </p>
          </div>
        </div>
      )}

      {/* TAB 7: PRIZES */}
      {activeTab === "PRIZES" && (
        <div className="esports-card p-6 space-y-4">
          <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
            Championship Recognition & Prizes
          </h2>
          <p className="text-sm text-white/90">
            {tournament.prizeDetails ||
              "Official eFootball Kenya Championship Title, National Elo Rating Points, and Verified Profile Achievement Badges."}
          </p>
          <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/40 text-xs text-brand-grey">
            Compliance Note: Free-entry community tournaments award verified Elo points, national
            county rankings, and championship badges. Regulated cash prize payouts remain gated
            until legal and payment-provider approvals are active.
          </div>
        </div>
      )}

      {/* TAB 8: ANNOUNCEMENTS */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div className="space-y-6">
          {canManage && (
            <form onSubmit={handlePostAnnouncement} className="esports-card p-5 space-y-3">
              <h3 className="font-display font-bold text-lg uppercase text-brand-yellow">
                Publish Organiser Announcement
              </h3>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement headline (e.g. Round 1 Check-In Now Open)"
                className="esports-input"
              />
              <textarea
                rows={2}
                required
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Announcement details for all registered players..."
                className="esports-input"
              />
              <button type="submit" disabled={loading} className="btn-yellow text-xs">
                Publish Announcement
              </button>
            </form>
          )}

          {tournament.announcements.length === 0 ? (
            <div className="esports-card p-8 text-center text-sm text-brand-grey">
              No announcements posted for this tournament yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tournament.announcements.map((a: any) => (
                <div key={a.id} className="esports-card p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-brand-grey">
                    <span className="text-brand-yellow font-bold">
                      Posted by {a.authorUsername}
                    </span>
                    <span>{new Date(a.createdAt).toLocaleString("en-KE")}</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">{a.title}</h3>
                  <p className="text-sm text-white/85 whitespace-pre-line">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
