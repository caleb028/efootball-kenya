"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Award,
  Shield,
  Bell,
  Settings,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { KENYA_COUNTIES, KENYA_UNIVERSITIES, PLATFORMS } from "@/lib/constants/kenya";

export function PlayerDashboardClient({
  user,
  dashboardData,
  initialSection = "OVERVIEW",
}: {
  user: any;
  dashboardData: any;
  initialSection?: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const { profile, notifications, challenges } = dashboardData;

  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [county, setCounty] = useState(profile.county || "Nairobi");
  const [platform, setPlatform] = useState(profile.platform || "MOBILE");
  const [efootballId, setEfootballId] = useState(profile.efootballId || "");
  const [university, setUniversity] = useState(profile.university || "");
  const [bio, setBio] = useState(profile.bio || "");

  const [opponentUsername, setOpponentUsername] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          county,
          platform,
          efootballId,
          university,
          bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed to update profile." });
      } else {
        setFeedback({ type: "ok", text: "Profile updated successfully!" });
        router.refresh();
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
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHALLENGE_CREATE",
          opponentUsername,
          platform,
          message: challengeMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed to send challenge." });
      } else {
        setOpponentUsername("");
        setChallengeMessage("");
        setFeedback({ type: "ok", text: data.message });
        router.refresh();
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRespondChallenge(challengeId: string, decision: "ACCEPTED" | "DECLINED") {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHALLENGE_RESPOND",
          challengeId,
          decision,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed." });
      } else {
        setFeedback({ type: "ok", text: data.message });
        if (data.matchId) {
          router.push(`/matches/${data.matchId}`);
        } else {
          router.refresh();
        }
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkNotificationsRead() {
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_NOTIFICATIONS_READ" }),
    });
    router.refresh();
  }

  const sidebarItems = [
    { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
    { id: "TOURNAMENTS", label: "My Tournaments", icon: Trophy },
    { id: "MATCHES", label: "Matches & History", icon: Swords },
    { id: "ACHIEVEMENTS", label: "Achievements", icon: Award },
    { id: "CLAN", label: "My Clan", icon: Shield },
    { id: "CHALLENGES", label: "Friendly Challenges", icon: Swords },
    { id: "NOTIFICATIONS", label: "Notifications", icon: Bell },
    { id: "PROFILE", label: "Edit Profile", icon: User },
    { id: "SETTINGS", label: "Account Settings", icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Deep Navy Dashboard Sidebar (Section 7) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-brand-navy border-2 border-brand-royal rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-royal flex items-center justify-center font-display font-bold text-xl text-brand-yellow">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-display font-bold text-lg text-white">
                  {profile.username}
                </div>
                <div className="text-xs text-brand-yellow font-display font-bold">
                  {profile.rating} ELO • #{profile.nationalRank} KE
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "bg-brand-yellow text-brand-navy shadow-esports-yellow"
                        : "text-white/85 hover:bg-brand-darkBlue hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-brand-royal/30 space-y-2">
              <Link
                href={`/players/${profile.username}`}
                className="btn-outline w-full text-xs py-2"
              >
                View Public Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Quick Actions Strip */}
          <div className="bg-brand-darkBlue border border-brand-royal/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-display font-bold uppercase text-sm text-brand-yellow">
              Quick Actions:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/tournaments" className="btn-yellow text-xs py-1.5 px-3">
                Find Tournament
              </Link>
              <button
                type="button"
                onClick={() => setSection("MATCHES")}
                className="btn-royal text-xs py-1.5 px-3"
              >
                View My Matches
              </button>
              <button
                type="button"
                onClick={() => setSection("CHALLENGES")}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Challenge Player
              </button>
              <Link href="/clans" className="btn-outline text-xs py-1.5 px-3">
                Join Clan
              </Link>
              <button
                type="button"
                onClick={() => setSection("PROFILE")}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs ${
                feedback.type === "ok"
                  ? "bg-brand-success/20 border-brand-success text-white"
                  : "bg-brand-error/20 border-brand-error text-white"
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* OVERVIEW SECTION */}
          {section === "OVERVIEW" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="esports-card p-5">
                  <div className="text-xs text-brand-grey">Current Elo Rating</div>
                  <div className="font-display font-bold text-3xl text-brand-yellow mt-1">
                    {profile.rating}
                  </div>
                </div>
                <div className="esports-card p-5">
                  <div className="text-xs text-brand-grey">National Position</div>
                  <div className="font-display font-bold text-3xl text-white mt-1">
                    #{profile.nationalRank}
                  </div>
                </div>
                <div className="esports-card p-5">
                  <div className="text-xs text-brand-grey">{profile.county} Rank</div>
                  <div className="font-display font-bold text-3xl text-white mt-1">
                    #{profile.countyRank}
                  </div>
                </div>
                <div className="esports-card p-5">
                  <div className="text-xs text-brand-grey">Win Percentage</div>
                  <div className="font-display font-bold text-3xl text-brand-success mt-1">
                    {profile.winPercentage}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="esports-card p-6 space-y-4">
                  <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
                    My Active & Upcoming Matches
                  </h2>
                  {profile.matchHistory.length === 0 ? (
                    <p className="text-xs text-brand-grey">
                      No matches scheduled yet. Join a tournament to receive your first fixture!
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {profile.matchHistory.slice(0, 5).map((m: any) => (
                        <Link
                          key={m.id}
                          href={`/matches/${m.id}`}
                          className="block p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 hover:border-brand-yellow text-xs"
                        >
                          <div className="flex justify-between text-brand-grey mb-1">
                            <span>{m.tournamentTitle}</span>
                            <span className="text-brand-yellow font-bold">{m.status}</span>
                          </div>
                          <div className="font-bold text-white text-sm">
                            {m.playerOneUsername}{" "}
                            <span className="text-brand-yellow">
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
                    My Tournaments ({profile.tournaments.length})
                  </h2>
                  {profile.tournaments.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-brand-grey">
                        You have not registered for any tournaments yet.
                      </p>
                      <Link href="/tournaments" className="btn-yellow text-xs">
                        Browse Open Tournaments
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {profile.tournaments.map((t: any) => (
                        <Link
                          key={t.id}
                          href={`/tournaments/${t.slug}`}
                          className="flex items-center justify-between p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 hover:border-brand-yellow text-xs"
                        >
                          <div>
                            <div className="font-bold text-white text-sm">{t.title}</div>
                            <div className="text-brand-grey">{t.format.replace(/_/g, " ")}</div>
                          </div>
                          <span className="esports-badge-yellow">{t.registrationStatus}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MY TOURNAMENTS */}
          {section === "TOURNAMENTS" && (
            <div className="esports-card p-6 space-y-4">
              <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                My Registered Tournaments
              </h2>
              {profile.tournaments.length === 0 ? (
                <p className="text-sm text-brand-grey">No tournament registrations yet.</p>
              ) : (
                <div className="space-y-3">
                  {profile.tournaments.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/tournaments/${t.slug}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-brand-navy border border-brand-royal/40 hover:border-brand-yellow"
                    >
                      <div>
                        <div className="font-display font-bold text-lg text-white">{t.title}</div>
                        <div className="text-xs text-brand-grey">
                          {t.platform} • {t.format.replace(/_/g, " ")} • Status: {t.status}
                        </div>
                      </div>
                      <span className="esports-badge-yellow">{t.registrationStatus}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MATCHES & HISTORY */}
          {section === "MATCHES" && (
            <div className="esports-card p-6 space-y-4">
              <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                My Matches & Verified Results
              </h2>
              {profile.matchHistory.length === 0 ? (
                <p className="text-sm text-brand-grey">No matches assigned or completed yet.</p>
              ) : (
                <div className="space-y-3">
                  {profile.matchHistory.map((m: any) => (
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS */}
          {section === "ACHIEVEMENTS" && (
            <div className="esports-card p-6 space-y-4">
              <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                Earned Competitive Achievements ({profile.achievements.length})
              </h2>
              {profile.achievements.length === 0 ? (
                <p className="text-sm text-brand-grey">
                  Win verified tournament matches to unlock official badges!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.achievements.map((a: any) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-brand-navy border border-brand-yellow/60 space-y-1"
                    >
                      <div className="font-display font-bold text-lg text-brand-yellow uppercase">
                        {a.title}
                      </div>
                      <p className="text-xs text-brand-grey">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY CLAN */}
          {section === "CLAN" && (
            <div className="esports-card p-6 space-y-4">
              <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                My Clan Affiliation
              </h2>
              {profile.clanSlug ? (
                <div className="p-5 rounded-xl bg-brand-navy border border-brand-royal/50 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-2xl text-white">
                      [{profile.clanTag}] {profile.clanName}
                    </div>
                    <p className="text-xs text-brand-grey mt-1">Active Clan Member</p>
                  </div>
                  <Link href={`/clans/${profile.clanSlug}`} className="btn-yellow text-xs">
                    Open Clan Hub
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-brand-grey">
                    You are not currently in a clan. Create a new clan or request to join an
                    existing Kenyan squad!
                  </p>
                  <Link href="/clans" className="btn-yellow text-xs">
                    Browse or Create Clans
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* FRIENDLY CHALLENGES */}
          {section === "CHALLENGES" && (
            <div className="space-y-6">
              <form onSubmit={handleSendChallenge} className="esports-card p-6 space-y-4">
                <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                  Send a Friendly Challenge (Free Match)
                </h2>
                <p className="text-xs text-brand-grey">
                  Friendly challenges create a dedicated Match Room for warmup and community bragging
                  rights. Per Section 16, friendly results remain separate from official tournament
                  Elo rankings and cash wagering is strictly prohibited.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={opponentUsername}
                    onChange={(e) => setOpponentUsername(e.target.value)}
                    placeholder="Opponent username (e.g. MombasaStriker)"
                    className="esports-input"
                  />
                  <input
                    type="text"
                    value={challengeMessage}
                    onChange={(e) => setChallengeMessage(e.target.value)}
                    placeholder="Message (e.g. Best of 1 on Mobile tonight at 8pm EAT)"
                    className="esports-input"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-yellow text-xs">
                  Send Challenge
                </button>
              </form>

              <div className="esports-card p-6 space-y-4">
                <h3 className="font-display font-bold text-xl uppercase text-white">
                  Challenge History ({challenges.length})
                </h3>
                {challenges.length === 0 ? (
                  <p className="text-xs text-brand-grey">No friendly challenges yet.</p>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((c: any) => {
                      const isIncoming = c.opponentId === user.id && c.status === "PENDING";
                      return (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl bg-brand-navy border border-brand-royal/40 flex flex-wrap items-center justify-between gap-4 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white text-sm">
                              {c.challengerUsername} vs {c.opponentUsername} ({c.platform})
                            </div>
                            {c.message && (
                              <p className="text-brand-grey mt-0.5">&ldquo;{c.message}&rdquo;</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isIncoming && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRespondChallenge(c.id, "ACCEPTED")}
                                  className="btn-yellow text-xs py-1.5 px-3"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondChallenge(c.id, "DECLINED")}
                                  className="btn-outline text-xs py-1.5 px-3"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {c.matchId && (
                              <Link
                                href={`/matches/${c.matchId}`}
                                className="btn-royal text-xs py-1.5 px-3"
                              >
                                Open Match Room
                              </Link>
                            )}
                            <span className="esports-badge-blue">{c.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "NOTIFICATIONS" && (
            <div className="esports-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                  Notifications ({notifications.length})
                </h2>
                <button
                  type="button"
                  onClick={handleMarkNotificationsRead}
                  className="text-xs font-bold text-brand-yellow hover:underline"
                >
                  Mark All as Read
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-brand-grey">No notifications yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-4 ${
                        n.readAt
                          ? "bg-brand-navy/60 border-brand-royal/30 text-brand-grey"
                          : "bg-brand-navy border-brand-yellow/60 text-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm">{n.title}</div>
                        <p className="text-brand-grey">{n.message}</p>
                      </div>
                      {n.linkUrl && (
                        <Link href={n.linkUrl} className="btn-outline text-xs py-1.5 px-3 shrink-0">
                          Open
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EDIT PROFILE & SETTINGS */}
          {(section === "PROFILE" || section === "SETTINGS") && (
            <form onSubmit={handleSaveProfile} className="esports-card p-6 space-y-4">
              <h2 className="font-display font-bold text-2xl uppercase text-brand-yellow">
                Update Player Profile & Preferences
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="esports-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                    eFootball In-Game ID
                  </label>
                  <input
                    type="text"
                    value={efootballId}
                    onChange={(e) => setEfootballId(e.target.value)}
                    className="esports-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                    Home County
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="esports-input"
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                    Primary Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="esports-input"
                  >
                    {PLATFORMS.filter((p) => p.id !== "CROSS_PLATFORM").map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                  University (Optional)
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="esports-input"
                >
                  <option value="">None</option>
                  {KENYA_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-grey mb-1">
                  Player Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="esports-input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-yellow">
                {loading ? "Saving..." : "Save Profile Settings"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
