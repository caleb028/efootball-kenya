"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Trophy,
  Swords,
  Award,
  UserPlus,
  Flag,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";

export function PlayerProfileClient({
  profile: initialProfile,
  currentUser,
}: {
  profile: any;
  currentUser: any | null;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "MATCH_HISTORY" | "TOURNAMENTS" | "ACHIEVEMENTS" | "STATISTICS"
  >("OVERVIEW");
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeMsg, setChallengeMsg] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const matchHistory = Array.isArray(profile?.matchHistory) ? profile.matchHistory : [];
  const tournaments = Array.isArray(profile?.tournaments) ? profile.tournaments : [];
  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : [];

  const isOwnProfile = currentUser?.id === profile?.id;

  async function handleFollow() {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${profile.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FOLLOW" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed." });
      } else {
        setProfile((p: any) => ({
          ...p,
          isFollowing: data.following,
          followersCount: data.following ? p.followersCount + 1 : p.followersCount - 1,
        }));
        setFeedback({ type: "ok", text: data.message });
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendChallenge(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${profile.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHALLENGE",
          platform: profile.platform,
          message: challengeMsg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Challenge failed." });
      } else {
        setChallengeOpen(false);
        setChallengeMsg("");
        setFeedback({ type: "ok", text: data.message });
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Player Profile Header */}
      <div className="bg-gradient-to-r from-brand-royal via-brand-darkBlue to-brand-navy border-2 border-brand-royal rounded-2xl p-6 sm:p-8 shadow-esports-blue">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-brand-navy border-2 border-brand-yellow flex items-center justify-center font-display font-bold text-3xl text-brand-yellow shadow-esports-yellow">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase text-white">
                  {profile.username}
                </h1>
                {profile.isVerified && (
                  <span className="esports-badge-yellow">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Player
                  </span>
                )}
                <span className="esports-badge-blue">{profile.platform}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-brand-grey">
                <span className="flex items-center gap-1 text-white">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
                  {profile.county} County
                </span>
                {profile.clanName && (
                  <Link
                    href={`/clans/${profile.clanSlug}`}
                    className="text-brand-yellow font-bold hover:underline"
                  >
                    Clan: [{profile.clanTag}] {profile.clanName}
                  </Link>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-yellow" />
                  Joined {new Date(profile.joinedAt).toLocaleDateString("en-KE")}
                </span>
                <span>{profile.followersCount} Followers</span>
              </div>

              {profile.bio && (
                <p className="text-sm text-white/85 max-w-2xl">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Actions (Follow, Challenge, View Clan, Report) */}
          {!isOwnProfile && currentUser && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={handleFollow}
                className="btn-royal text-xs py-2.5 px-4"
              >
                <UserPlus className="w-4 h-4" />
                {profile.isFollowing ? "Following" : "Follow"}
              </button>
              <button
                type="button"
                onClick={() => setChallengeOpen((v) => !v)}
                className="btn-yellow text-xs py-2.5 px-4"
              >
                <Swords className="w-4 h-4" />
                Challenge Player
              </button>
              {profile.clanSlug && (
                <Link
                  href={`/clans/${profile.clanSlug}`}
                  className="btn-outline text-xs py-2.5 px-3"
                >
                  View Clan
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Friendly Challenge Modal Drawer */}
        {challengeOpen && (
          <form
            onSubmit={handleSendChallenge}
            className="mt-6 pt-5 border-t border-brand-royal/40 flex flex-col sm:flex-row items-center gap-3"
          >
            <input
              type="text"
              value={challengeMsg}
              onChange={(e) => setChallengeMsg(e.target.value)}
              placeholder={`Optional message for ${profile.username} (Free friendly match)...`}
              className="esports-input text-xs"
            />
            <button type="submit" disabled={loading} className="btn-yellow text-xs shrink-0">
              Send Friendly Challenge
            </button>
          </form>
        )}

        {feedback && (
          <div className="mt-4 p-3 rounded-lg bg-brand-navy border border-brand-yellow/60 text-xs text-white">
            {feedback.text}
          </div>
        )}
      </div>

      {/* Competitive Statistics Strip (Section 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="esports-card p-4 text-center">
          <div className="text-xs text-brand-grey">National Rank</div>
          <div className="font-display font-bold text-3xl text-brand-yellow">
            #{profile.nationalRank}
          </div>
        </div>
        <div className="esports-card p-4 text-center">
          <div className="text-xs text-brand-grey">{profile.county} Rank</div>
          <div className="font-display font-bold text-3xl text-white">
            #{profile.countyRank}
          </div>
        </div>
        <div className="esports-card p-4 text-center">
          <div className="text-xs text-brand-grey">Elo Rating</div>
          <div className="font-display font-bold text-3xl text-brand-yellow">
            {profile.rating}
          </div>
        </div>
        <div className="esports-card p-4 text-center">
          <div className="text-xs text-brand-grey">Matches (W-D-L)</div>
          <div className="font-display font-bold text-2xl text-white">
            {profile.wins}-{profile.draws}-{profile.losses}
          </div>
        </div>
        <div className="esports-card p-4 text-center">
          <div className="text-xs text-brand-grey">Win Rate</div>
          <div className="font-display font-bold text-3xl text-brand-success">
            {profile.winPercentage}%
          </div>
        </div>
        <div className="esports-card p-4 text-center">
          <div className="text-xs text-brand-grey">Titles Won</div>
          <div className="font-display font-bold text-3xl text-brand-gold">
            {profile.championshipsWon}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-royal/40">
        {[
          { id: "OVERVIEW", label: "Overview" },
          { id: "MATCH_HISTORY", label: `Match History (${profile.matchHistory.length})` },
          { id: "TOURNAMENTS", label: `Tournaments (${profile.tournaments.length})` },
          { id: "ACHIEVEMENTS", label: `Achievements (${profile.achievements.length})` },
          { id: "STATISTICS", label: "Detailed Statistics" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-lg font-display font-bold uppercase text-sm whitespace-nowrap ${
              activeTab === t.id
                ? "bg-brand-yellow text-brand-navy"
                : "bg-brand-darkBlue text-white/85 border border-brand-royal/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="esports-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
              Recent Verified Matches
            </h2>
            {matchHistory.length === 0 ? (
              <p className="text-xs text-brand-grey">No matches completed yet.</p>
            ) : (
              <div className="space-y-2.5">
                {matchHistory.slice(0, 5).map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 hover:border-brand-yellow text-xs"
                  >
                    <div className="flex justify-between text-brand-grey mb-1">
                      <span>{m.tournamentTitle}</span>
                      <span className="text-brand-yellow uppercase font-bold">{m.status}</span>
                    </div>
                    <div className="font-bold text-white text-sm">
                      {m.playerOneUsername}{" "}
                      <span className="text-brand-yellow px-1">
                        {m.playerOneScore ?? "-"} : {m.playerTwoScore ?? "-"}
                      </span>{" "}
                      {m.playerTwoUsername}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="esports-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
              Earned Achievement Badges
            </h2>
            {achievements.length === 0 ? (
              <p className="text-xs text-brand-grey">
                Achievements are unlocked automatically from verified match wins and championships.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-brand-navy border border-brand-yellow/50 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-brand-yellow uppercase">
                        {a.title}
                      </span>
                      <Award className="w-4 h-4 text-brand-gold" />
                    </div>
                    <p className="text-xs text-brand-grey">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "MATCH_HISTORY" && (
        <div className="esports-card p-6 space-y-3">
          {matchHistory.length === 0 ? (
            <p className="text-sm text-brand-grey">No match history recorded yet.</p>
          ) : (
            matchHistory.map((m: any) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-brand-navy border border-brand-royal/40 hover:border-brand-yellow"
              >
                <div>
                  <div className="text-xs text-brand-grey">
                    {m.tournamentTitle} • {m.roundLabel}
                  </div>
                  <div className="font-bold text-white text-base">
                    {m.playerOneUsername}{" "}
                    <span className="text-brand-yellow font-display px-1.5">
                      {m.playerOneScore ?? "-"} : {m.playerTwoScore ?? "-"}
                    </span>{" "}
                    {m.playerTwoUsername}
                  </div>
                </div>
                <span className="esports-badge-blue">{m.status}</span>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "TOURNAMENTS" && (
        <div className="esports-card p-6 space-y-3">
          {tournaments.length === 0 ? (
            <p className="text-sm text-brand-grey">No tournament entries yet.</p>
          ) : (
            tournaments.map((t: any) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="flex items-center justify-between p-4 rounded-xl bg-brand-navy border border-brand-royal/40 hover:border-brand-yellow"
              >
                <div>
                  <div className="font-display font-bold text-lg text-white">{t.title}</div>
                  <div className="text-xs text-brand-grey">
                    {(t.format || "SINGLE_ELIMINATION").replace(/_/g, " ")} • {t.platform || "ALL"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.isChampion && <span className="esports-badge-yellow">Champion</span>}
                  <span className="esports-badge-blue">{t.status}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "ACHIEVEMENTS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.length === 0 ? (
            <div className="esports-card p-8 text-center col-span-full text-sm text-brand-grey">
              No badges earned yet. Win verified tournament matches to unlock badges!
            </div>
          ) : (
            achievements.map((a: any) => (
              <div key={a.id} className="esports-card p-5 space-y-2 border-brand-yellow/60">
                <div className="flex items-center justify-between">
                  <span className="esports-badge-yellow">{a.tier} BADGE</span>
                  <Award className="w-5 h-5 text-brand-gold" />
                </div>
                <h3 className="font-display font-bold text-xl uppercase text-white">{a.title}</h3>
                <p className="text-xs text-brand-grey">{a.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "STATISTICS" && (
        <div className="esports-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/40">
            <div className="text-xs text-brand-grey">Peak Elo Rating</div>
            <div className="font-display font-bold text-2xl text-brand-yellow">
              {profile.peakRating}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/40">
            <div className="text-xs text-brand-grey">Goals Scored</div>
            <div className="font-display font-bold text-2xl text-white">
              {profile.goalsScored}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/40">
            <div className="text-xs text-brand-grey">Goals Conceded</div>
            <div className="font-display font-bold text-2xl text-white">
              {profile.goalsConceded}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/40">
            <div className="text-xs text-brand-grey">Best Winning Streak</div>
            <div className="font-display font-bold text-2xl text-brand-success">
              {profile.bestStreak} Wins
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
