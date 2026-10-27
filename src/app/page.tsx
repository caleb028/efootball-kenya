import React from "react";
import Link from "next/link";
import {
  Trophy,
  Swords,
  Shield,
  ArrowRight,
  Gamepad2,
  Users,
} from "lucide-react";
import {
  getPlatformStats,
  getLiveAndRecentMatches,
  getLeaderboard,
} from "@/lib/services/rankings-players";
import { listTournaments } from "@/lib/services/tournaments";
import { listClans } from "@/lib/services/clans-community";
import { getCurrentUser } from "@/lib/services/auth";

export default function HomePage() {
  let user = null;
  let stats: ReturnType<typeof getPlatformStats> = {
    registeredPlayers: 0,
    tournamentsHosted: 0,
    completedTournaments: 0,
    matchesCompleted: 0,
    activeClans: 0,
  };
  let tournaments: ReturnType<typeof listTournaments> = [];
  let liveMatches: ReturnType<typeof getLiveAndRecentMatches> = [];
  let topPlayers: ReturnType<typeof getLeaderboard> = [];
  let clans: ReturnType<typeof listClans> = [];

  try {
    user = getCurrentUser();
  } catch (err) {
    console.error("HomePage: Failed to get current user:", err);
  }

  try {
    stats = getPlatformStats();
  } catch (err) {
    console.error("HomePage: Failed to get platform stats:", err);
  }

  try {
    tournaments = listTournaments().slice(0, 6);
  } catch (err) {
    console.error("HomePage: Failed to list tournaments:", err);
  }

  try {
    liveMatches = getLiveAndRecentMatches(4);
  } catch (err) {
    console.error("HomePage: Failed to get live matches:", err);
  }

  try {
    topPlayers = getLeaderboard({ limit: 5 });
  } catch (err) {
    console.error("HomePage: Failed to get leaderboard:", err);
  }

  try {
    clans = listClans({ limit: 3 });
  } catch (err) {
    console.error("HomePage: Failed to list clans:", err);
  }

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION — Styled with Exact Logo Royal Blue (#00189D) & Electric Yellow (#FFFF00) */}
      <section className="relative overflow-hidden bg-stadium-glow border-b-2 border-[#FFFF00]/20 pt-12 pb-16 lg:pt-16 lg:pb-24">
        {/* Stadium Floodlight & Pitch Grid Atmosphere */}
        <div
          className="absolute inset-0 bg-pitch-grid bg-[size:40px_40px] opacity-25 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -top-24 left-1/4 w-96 h-96 bg-[#002BDC]/40 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-10 right-10 w-80 h-80 bg-[#FFFF00]/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Headline & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#001275] border border-[#002BDC] px-4 py-1.5 rounded-full shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFFF00] animate-pulse" />
                <span className="font-display font-extrabold uppercase tracking-widest text-xs text-[#FFFF00]">
                  PLAY. COMPETE. BELONG.
                </span>
                <span className="text-white/30">•</span>
                <span className="text-xs font-semibold text-white/90">
                  Every Match Counts
                </span>
              </div>

              <h1 className="font-display font-extrabold uppercase text-4xl sm:text-6xl lg:text-7xl leading-[0.94] tracking-tight text-white">
                KENYA&apos;S HOME OF{" "}
                <span className="text-[#FFFF00] block mt-1 drop-shadow-[0_4px_24px_rgba(255,255,0,0.35)]">
                  COMPETITIVE eFOOTBALL
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed">
                Enter verified cups, compete inside dedicated Match Rooms, earn official national Elo rankings, and lead your clan to victory across all 47 counties.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/tournaments" className="btn-yellow text-base px-8 py-3.5">
                  <Trophy className="w-5 h-5" />
                  Compete in Tournaments
                </Link>
                <Link
                  href={user ? "/dashboard" : "/register"}
                  className="btn-outline text-base px-7 py-3.5"
                >
                  {user ? "Player Dashboard" : "Create Profile"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Supported Platforms Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-[#FFFF00]" />
                  Platforms:
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#001582] border border-[#002BDC] text-white font-semibold">
                  Mobile (Android / iOS)
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#001582] border border-[#002BDC] text-white font-semibold">
                  PlayStation (PS4 / PS5)
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#001582] border border-[#002BDC] text-white font-semibold">
                  PC (Steam)
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#001582] border border-[#002BDC] text-white font-semibold">
                  Xbox
                </span>
              </div>
            </div>

            {/* Right: Live Ecosystem Stats Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#001582]/95 border-2 border-[#002BDC] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#002BDC] pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFFF00]" />
                    <h2 className="font-display font-extrabold text-lg uppercase tracking-wider text-white">
                      Verified Ecosystem Stats
                    </h2>
                  </div>
                  <span className="badge-yellow text-[10px]">EAT (UTC+3)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#001275] border border-[#002BDC] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                      <span>Players</span>
                      <Users className="w-4 h-4 text-[#FFFF00]" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-white">
                      {stats.registeredPlayers.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#001275] border border-[#002BDC] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                      <span>Tournaments</span>
                      <Trophy className="w-4 h-4 text-[#FFFF00]" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-white">
                      {stats.tournamentsHosted.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#001275] border border-[#002BDC] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                      <span>Verified Matches</span>
                      <Swords className="w-4 h-4 text-[#FFFF00]" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-white">
                      {stats.matchesCompleted.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#001275] border border-[#002BDC] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                      <span>Active Clans</span>
                      <Shield className="w-4 h-4 text-[#FFFF00]" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-white">
                      {stats.activeClans.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-[#00189D]/70 border border-[#FFFF00]/40 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#FFFF00]">
                      100% Real Elo & Brackets
                    </div>
                    <p className="text-[11px] text-slate-200 mt-0.5">
                      Zero fabricated metrics. All data driven by real tournament fixtures.
                    </p>
                  </div>
                  <Link href="/rankings" className="btn-yellow text-xs py-2 px-3 shrink-0">
                    Leaderboard
                  </Link>
                </div>

                {/* Mobile App & PWA Banner */}
                <div className="mt-3.5 bg-[#001275]/90 border border-[#002BDC] rounded-xl p-3 flex items-center gap-3.5 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/icon-96x96.png"
                    alt="eFootball ARENA Mobile App Icon"
                    className="w-12 h-12 rounded-xl object-cover border border-[#FFFF00]/70 shadow-[0_0_12px_rgba(255,255,0,0.3)] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-display font-extrabold uppercase text-white flex items-center gap-1.5">
                      <span>Official Mobile App & PWA</span>
                      <span className="w-2 h-2 rounded-full bg-[#00D044]" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Install on Android, iOS & PC for instant match alerts
                    </p>
                  </div>
                  <span className="badge-yellow text-[10px] shrink-0 font-bold">PWA Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOURNAMENTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#FFFF00] tracking-wider mb-1">
              <Trophy className="w-4 h-4" /> Official Tournaments
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-white">
              Active & Upcoming Competitions
            </h2>
          </div>
          <Link href="/tournaments" className="btn-outline text-xs py-2">
            View All Tournaments
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="card-esports p-8 text-center space-y-3">
            <Trophy className="w-10 h-10 text-[#FFFF00] mx-auto" />
            <h3 className="font-display font-bold text-xl uppercase text-white">
              No Tournaments Live Right Now
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Organisers and Tournament Admins can launch cups anytime from the Organiser Hub.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/organiser/tournaments/new" className="btn-yellow text-xs">
                Create First Tournament
              </Link>
              <Link href="/tournaments" className="btn-outline text-xs">
                Browse Archive
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const isOpen = t.status === "REGISTRATION_OPEN" || t.status === "PUBLISHED";
              return (
                <div
                  key={t.id}
                  className="esports-card-hover flex flex-col justify-between overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-[#0025D0] to-[#001582] p-5 border-b border-[#002BDC]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#001275] text-white text-[11px] font-bold uppercase tracking-wider border border-white/20">
                        {t.platform}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-display font-bold uppercase tracking-wider ${
                          isOpen
                            ? "bg-[#FFFF00] text-[#00189D]"
                            : t.status === "IN_PROGRESS"
                            ? "bg-[#00D044] text-[#00189D]"
                            : "bg-[#001275] text-slate-300"
                        }`}
                      >
                        {(t.status || "PUBLISHED").replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-xl uppercase text-white leading-snug">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-200 mt-1">
                      {(t.format || "SINGLE_ELIMINATION").replace(/_/g, " ")} • {t.region || "National"}
                    </p>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Slots:</span>
                        <span className="text-[#FFFF00] font-display font-extrabold text-sm">
                          {t.registeredCount} / {t.maxParticipants} Registered
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Entry:</span>
                        <span className="text-white font-medium truncate max-w-[180px]">
                          {t.entryRequirement}
                        </span>
                      </div>
                      {t.prizeDetails && (
                        <div className="flex items-center justify-between">
                          <span>Prize / Glory:</span>
                          <span className="text-[#FFFF00] font-semibold">
                            {t.prizeDetails}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#002BDC]">
                      <Link
                        href={`/tournaments/${t.slug}`}
                        className={isOpen ? "btn-yellow w-full text-xs" : "btn-royal w-full text-xs"}
                      >
                        {isOpen ? "Register Now" : "View Bracket & Fixtures"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. LEADERBOARD & CLANS — Side-by-Side Competitive Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Top 5 National Elo Podium */}
          <div className="lg:col-span-7 card-esports p-6">
            <div className="flex items-center justify-between mb-5 border-b border-[#002BDC] pb-4">
              <div>
                <span className="badge-yellow text-[10px]">National Standings</span>
                <h2 className="font-display font-extrabold text-2xl uppercase tracking-wider text-white mt-1">
                  Top Ranked Players
                </h2>
              </div>
              <Link href="/rankings" className="text-xs font-bold text-[#FFFF00] hover:underline flex items-center gap-1">
                Full Rankings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topPlayers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-300">
                No ranked players yet. Register and compete to take the #1 spot!
              </div>
            ) : (
              <div className="divide-y divide-[#002BDC]/60">
                {topPlayers.map((p) => {
                  const medal =
                    p.position === 1
                      ? "bg-[#FFFF00] text-[#00189D]"
                      : p.position === 2
                      ? "bg-slate-200 text-[#00189D]"
                      : p.position === 3
                      ? "bg-amber-400 text-[#00189D]"
                      : "bg-[#001275] text-slate-300";
                  return (
                    <div
                      key={p.userId}
                      className="py-3 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-md font-display font-extrabold text-xs flex items-center justify-center shrink-0 ${medal}`}
                        >
                          #{p.position}
                        </span>
                        <div>
                          <Link
                            href={`/players/${p.username}`}
                            className="font-bold text-white hover:text-[#FFFF00] transition-colors"
                          >
                            {p.username}
                          </Link>
                          <div className="text-[11px] text-slate-300">
                            {p.county} • {p.platform}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-extrabold text-base text-[#FFFF00]">
                          {p.rating} PTS
                        </div>
                        <div className="text-[10px] text-slate-300">
                          {p.wins}W ({p.winPercentage}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Featured Clans & Quick Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card-esports p-6">
              <div className="flex items-center justify-between mb-4 border-b border-[#002BDC] pb-3">
                <div>
                  <span className="badge-blue text-[10px]">Clans Ecosystem</span>
                  <h3 className="font-display font-extrabold text-xl uppercase tracking-wider text-white mt-1">
                    Featured Clans
                  </h3>
                </div>
                <Link href="/clans" className="text-xs font-bold text-[#FFFF00] hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {clans.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-300 space-y-3">
                  <Shield className="w-8 h-8 text-[#FFFF00] mx-auto" />
                  <p>Found a clan, recruit top players from your county, and challenge rivals.</p>
                  <Link href="/clans" className="btn-yellow text-xs py-2 px-4 inline-flex">
                    Create a Clan
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {clans.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clans/${c.slug}`}
                      className="p-3.5 rounded-xl bg-[#001275] border border-[#002BDC] hover:border-[#FFFF00] flex items-center justify-between gap-3 transition-colors block"
                    >
                      <div className="flex items-center gap-3">
                        <span className="badge-yellow text-xs shrink-0">[{c.tag}]</span>
                        <div>
                          <div className="font-bold text-white text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-300">
                            {c.county} • {c.memberCount} Members
                          </div>
                        </div>
                      </div>
                      <div className="font-display font-extrabold text-sm text-[#FFFF00]">
                        {c.rating} Elo
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Match Room & Fair Play Assurance Card */}
            <div className="card-esports p-5 bg-gradient-to-r from-[#0025D0]/40 to-[#001582] border border-[#FFFF00]/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFFF00] text-[#00189D] flex items-center justify-center shrink-0 shadow">
                  <Swords className="w-5 h-5 text-[#00189D]" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold uppercase text-white text-sm">
                    Dual-Score Verification
                  </h4>
                  <p className="text-xs text-slate-200 mt-1">
                    Both opponents submit scores inside secure Match Rooms with screenshot evidence. Conflicts automatically route to the Fair Play Tribunal.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/fair-play" className="text-xs font-bold text-[#FFFF00] hover:underline">
                      Fair Play Rules →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECENT MATCHES */}
      {liveMatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-extrabold text-xl uppercase tracking-wider text-white">
              Recent Match Results
            </h3>
            <Link href="/tournaments" className="text-xs font-bold text-[#FFFF00] hover:underline">
              Match Rooms →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveMatches.map((m) => (
              <div key={m.id} className="card-esports p-4 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-300 truncate">
                  {m.tournamentTitle}
                </div>
                <div className="flex items-center justify-between font-display font-bold text-sm">
                  <span className="truncate max-w-[90px] text-white">{m.playerOneUsername}</span>
                  <span className="px-2 py-0.5 rounded bg-[#001275] text-[#FFFF00] font-extrabold">
                    {m.playerOneScore !== null && m.playerTwoScore !== null
                      ? `${m.playerOneScore} - ${m.playerTwoScore}`
                      : "vs"}
                  </span>
                  <span className="truncate max-w-[90px] text-white text-right">{m.playerTwoUsername}</span>
                </div>
                <Link
                  href={`/matches/${m.id}`}
                  className="block text-center text-[11px] text-slate-300 hover:text-[#FFFF00] pt-1"
                >
                  View Match Room
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
