import React from "react";
import Link from "next/link";
import { Users, MapPin, ShieldCheck, Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/services/rankings-players";
import { KENYA_COUNTIES, PLATFORMS } from "@/lib/constants/kenya";

export default function PlayersDirectoryPage({
  searchParams,
}: {
  searchParams: { county?: string; platform?: string; q?: string };
}) {
  const players = getLeaderboard({
    county: searchParams.county,
    platform: searchParams.platform,
    search: searchParams.q,
    limit: 60,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-brand-royal/40 pb-6">
        <span className="esports-badge-yellow mb-2">National Roster</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
          Kenyan eFootball Players
        </h1>
        <p className="text-sm text-brand-grey mt-1">
          Discover competitors across all 47 counties, inspect verified match records, and send
          friendly challenges.
        </p>
      </div>

      <form
        method="GET"
        action="/players"
        className="esports-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
      >
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="Search player username..."
          className="esports-input"
        />
        <select
          name="county"
          defaultValue={searchParams.county || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All 47 Counties</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="platform"
          defaultValue={searchParams.platform || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All Platforms</option>
          {PLATFORMS.filter((p) => p.id !== "CROSS_PLATFORM").map((p) => (
            <option key={p.id} value={p.id}>
              {p.short}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-royal w-full">
          Search Players
        </button>
      </form>

      {players.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-3">
          <Users className="w-10 h-10 text-brand-yellow mx-auto" />
          <h2 className="font-display font-bold text-2xl uppercase text-white">
            No Registered Players Match Your Search
          </h2>
          <Link href="/register" className="btn-yellow text-xs">
            Create Player Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {players.map((p) => (
            <Link
              key={p.userId}
              href={`/players/${p.username}`}
              className="esports-card-hover p-5 flex flex-col justify-between gap-4 block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-royal border border-brand-yellow/60 flex items-center justify-center font-display font-bold text-xl text-brand-yellow">
                    {p.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display font-bold text-xl text-white flex items-center gap-1.5">
                      <span>{p.username}</span>
                      {p.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                      )}
                    </div>
                    <div className="text-xs text-brand-grey flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-yellow" />
                      {p.county} • {p.platform}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-brand-navy font-display font-bold text-sm text-brand-yellow">
                  #{p.position}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-brand-royal/30 text-center">
                <div className="bg-brand-navy/80 rounded-lg p-2">
                  <div className="font-display font-bold text-lg text-brand-yellow">
                    {p.rating}
                  </div>
                  <div className="text-[10px] uppercase text-brand-grey">ELO</div>
                </div>
                <div className="bg-brand-navy/80 rounded-lg p-2">
                  <div className="font-display font-bold text-lg text-white">{p.wins}</div>
                  <div className="text-[10px] uppercase text-brand-grey">Wins</div>
                </div>
                <div className="bg-brand-navy/80 rounded-lg p-2">
                  <div className="font-display font-bold text-lg text-white">
                    {p.winPercentage}%
                  </div>
                  <div className="text-[10px] uppercase text-brand-grey">Win Rate</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
