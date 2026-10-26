import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { getLeaderboard } from "@/lib/services/rankings-players";
import { listClans } from "@/lib/services/clans-community";
import { KENYA_COUNTIES, KENYA_UNIVERSITIES, PLATFORMS } from "@/lib/constants/kenya";

export default function RankingsPage({
  searchParams,
}: {
  searchParams?: {
    tab?: string;
    county?: string;
    platform?: string;
    university?: string;
    q?: string;
  };
}) {
  const params = searchParams || {};
  const activeTab = (typeof params.tab === "string" && params.tab) || "NATIONAL";
  const isClanTab = activeTab === "CLANS";
  const isUniversityTab = activeTab === "UNIVERSITY";

  const platformFilter =
    activeTab === "MOBILE"
      ? "MOBILE"
      : activeTab === "PLAYSTATION"
      ? "PLAYSTATION"
      : activeTab === "PC"
      ? "PC"
      : typeof params.platform === "string" ? params.platform : undefined;

  let leaderboard: ReturnType<typeof getLeaderboard> = [];
  let clanLeaderboard: ReturnType<typeof listClans> = [];

  try {
    if (!isClanTab) {
      leaderboard = getLeaderboard({
        county: typeof params.county === "string" ? params.county : undefined,
        platform: platformFilter,
        universityOnly: isUniversityTab,
        university: typeof params.university === "string" ? params.university : undefined,
        search: typeof params.q === "string" ? params.q : undefined,
        limit: 100,
      });
    } else {
      clanLeaderboard = listClans({
        county: typeof params.county === "string" ? params.county : undefined,
        search: typeof params.q === "string" ? params.q : undefined,
        limit: 100,
      });
    }
  } catch (err) {
    console.error("RankingsPage: Error fetching leaderboard:", err);
    leaderboard = [];
    clanLeaderboard = [];
  }

  const boardTabs = [
    { id: "NATIONAL", label: "National Rankings" },
    { id: "COUNTY", label: "47-County Rankings" },
    { id: "MOBILE", label: "Mobile Rankings" },
    { id: "PLAYSTATION", label: "PlayStation Rankings" },
    { id: "PC", label: "PC Rankings" },
    { id: "UNIVERSITY", label: "University Rankings" },
    { id: "CLANS", label: "Clan Rankings" },
    { id: "SEASONAL", label: "Season 1 (2026)" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-brand-royal/40 pb-6">
        <div>
          <span className="esports-badge-yellow mb-2">Official Elo Rating System</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
            eFootball Kenya Leaderboards
          </h1>
          <p className="text-sm text-brand-grey mt-1">
            Live national, county, platform, university, and clan standings driven strictly by
            verified competitive match results.
          </p>
        </div>

        <div className="bg-brand-darkBlue border border-brand-royal/50 rounded-xl px-4 py-3 text-xs text-brand-grey">
          <div className="font-display font-bold uppercase text-brand-yellow">
            Elo Rating Formula (K = 32)
          </div>
          <div className="font-mono text-[11px] text-white mt-0.5">
            E = 1 / (1 + 10^((R_opp - R_player) / 400))
          </div>
        </div>
      </div>

      {/* Leaderboard Type Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {boardTabs.map((t) => (
          <Link
            key={t.id}
            href={`/rankings?tab=${t.id}`}
            className={`px-4 py-2.5 rounded-lg font-display font-bold uppercase tracking-wider text-sm whitespace-nowrap transition-all ${
              activeTab === t.id
                ? "bg-brand-yellow text-brand-navy shadow-esports-yellow"
                : "bg-brand-darkBlue text-white/85 hover:text-white border border-brand-royal/40"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Search & 47-County / Platform / University Filter Form */}
      <form
        method="GET"
        action="/rankings"
        className="esports-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input type="hidden" name="tab" value={activeTab} />

        <input
          type="search"
          name="q"
          defaultValue={params.q || ""}
          placeholder={isClanTab ? "Search clan name or tag..." : "Search player username..."}
          className="esports-input"
        />

        {/* All 47 Kenyan Counties Selector (Section 13) */}
        <select
          name="county"
          defaultValue={params.county || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All 47 Kenyan Counties</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c} County
            </option>
          ))}
        </select>

        {!isClanTab && (
          <select
            name="platform"
            defaultValue={platformFilter || "ALL"}
            className="esports-input"
          >
            <option value="ALL">All Platforms</option>
            {PLATFORMS.filter((p) => p.id !== "CROSS_PLATFORM").map((p) => (
              <option key={p.id} value={p.id}>
                {p.short}
              </option>
            ))}
          </select>
        )}

        {isUniversityTab ? (
          <select
            name="university"
            defaultValue={params.university || "ALL"}
            className="esports-input"
          >
            <option value="ALL">All Kenyan Universities</option>
            {KENYA_UNIVERSITIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        ) : (
          <div className="hidden lg:block" />
        )}

        <button type="submit" className="btn-royal w-full">
          Filter Standings
        </button>
      </form>

      {/* Clan Leaderboard View */}
      {isClanTab ? (
        <div className="esports-card overflow-hidden">
          {clanLeaderboard.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Shield className="w-10 h-10 text-brand-yellow mx-auto" />
              <div className="font-display font-bold text-xl uppercase text-white">
                No Ranked Clans Found
              </div>
              <Link href="/clans" className="btn-yellow text-xs">
                Create or Join a Clan
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-brand-navy border-b border-brand-royal/50 text-xs font-display uppercase text-brand-yellow">
                    <th className="py-3.5 px-4">Pos</th>
                    <th className="py-3.5 px-4">Clan</th>
                    <th className="py-3.5 px-4">County</th>
                    <th className="py-3.5 px-4 text-center">Members</th>
                    <th className="py-3.5 px-4 text-center">Record (W-D-L)</th>
                    <th className="py-3.5 px-4 text-right">Clan Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-royal/25">
                  {clanLeaderboard.map((c) => (
                    <tr key={c.id} className="hover:bg-brand-royal/15">
                      <td className="py-3.5 px-4 font-display font-bold text-brand-yellow">
                        #{c.rank}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        <Link href={`/clans/${c.slug}`} className="hover:text-brand-yellow">
                          <span className="text-brand-yellow font-mono mr-1.5">[{c.tag}]</span>
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-brand-grey">{c.county}</td>
                      <td className="py-3.5 px-4 text-center">{c.memberCount}</td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        {c.wins}W - {c.draws}D - {c.losses}L
                      </td>
                      <td className="py-3.5 px-4 text-right font-display font-bold text-lg text-brand-yellow">
                        {c.rating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Player Elo Leaderboard View */
        <div className="esports-card overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Trophy className="w-10 h-10 text-brand-yellow mx-auto" />
              <div className="font-display font-bold text-xl uppercase text-white">
                No Players Match This Leaderboard Filter
              </div>
              <p className="text-xs text-brand-grey">
                Register an account or clear the filters to view all active players.
              </p>
              <Link href="/register" className="btn-yellow text-xs">
                Register Player Profile
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-brand-navy border-b border-brand-royal/50 text-xs font-display font-bold uppercase tracking-wider text-brand-yellow">
                    <th className="py-3.5 px-4">Position</th>
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4">County</th>
                    <th className="py-3.5 px-4">Platform</th>
                    <th className="py-3.5 px-4 text-right">Rating</th>
                    <th className="py-3.5 px-4 text-right">Matches</th>
                    <th className="py-3.5 px-4 text-right">Wins</th>
                    <th className="py-3.5 px-4 text-right">Win %</th>
                    <th className="py-3.5 px-4 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-royal/25">
                  {leaderboard.map((p) => {
                    const isTop3 = p.position <= 3;
                    const badgeStyle =
                      p.position === 1
                        ? "bg-brand-gold text-brand-navy font-extrabold"
                        : p.position === 2
                        ? "bg-slate-300 text-brand-navy font-extrabold"
                        : p.position === 3
                        ? "bg-amber-600 text-white font-extrabold"
                        : "bg-brand-navy text-brand-grey";
                    return (
                      <tr
                        key={p.userId}
                        className={`hover:bg-brand-royal/20 transition-colors ${
                          isTop3 ? "bg-brand-royal/10" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-display text-sm ${badgeStyle}`}
                          >
                            #{p.position}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <Link
                            href={`/players/${p.username}`}
                            className="hover:text-brand-yellow flex items-center gap-2"
                          >
                            <span>{p.username}</span>
                            {p.clanTag && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-brand-navy text-brand-yellow font-mono">
                                [{p.clanTag}]
                              </span>
                            )}
                          </Link>
                          {p.university && (
                            <div className="text-[11px] text-brand-grey font-normal">
                              {p.university}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-brand-grey">{p.county}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs px-2 py-0.5 rounded bg-brand-navy border border-brand-royal/40 text-white">
                            {p.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-bold text-lg text-brand-yellow">
                          {p.rating}
                        </td>
                        <td className="py-3.5 px-4 text-right text-white">{p.matchesPlayed}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-white">
                          {p.wins}
                        </td>
                        <td className="py-3.5 px-4 text-right text-brand-grey">
                          {p.winPercentage}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.lastRatingChange > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-success">
                              <TrendingUp className="w-3.5 h-3.5" />+{p.lastRatingChange}
                            </span>
                          ) : p.lastRatingChange < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-error">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {p.lastRatingChange}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-xs text-brand-grey">
                              <Minus className="w-3.5 h-3.5" />0
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
