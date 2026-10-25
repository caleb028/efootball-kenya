"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KENYA_COUNTIES, KENYA_UNIVERSITIES, PLATFORMS } from "@/lib/constants/kenya";
import { Logo } from "@/components/brand/Logo";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [platform, setPlatform] = useState("MOBILE");
  const [efootballId, setEfootballId] = useState("");
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [requestOrganiserRole, setRequestOrganiserRole] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: displayName || username,
          email,
          password,
          county,
          platform,
          efootballId,
          university: university || undefined,
          bio,
          requestOrganiserRole,
          ageConfirmed,
          termsAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <div className="esports-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo variant="compact" size="md" />
          </div>
          <h1 className="font-display font-bold text-3xl uppercase text-white">
            Create Your eFootball Kenya Profile
          </h1>
          <p className="text-xs text-brand-grey">
            Start with an official 1200 Elo rating, represent your county, and join tournaments.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-brand-error/20 border border-brand-error text-xs text-white flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-brand-error shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. NairobiKing254"
                className="esports-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Brian Kamau"
                className="esports-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@domain.co.ke"
                className="esports-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                eFootball In-Game ID (Optional)
              </label>
              <input
                type="text"
                value={efootballId}
                onChange={(e) => setEfootballId(e.target.value)}
                placeholder="e.g. ASDF-123-456-789"
                className="esports-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Home County (All 47 Counties) *
              </label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="esports-input"
              >
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c} County
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Preferred Gaming Platform *
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
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              University (Optional — For University Leaderboard & Cups)
            </label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="esports-input"
            >
              <option value="">Not a University Student / Prefer not to say</option>
              {KENYA_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Password (Min. 8 chars) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="esports-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="esports-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              Player Bio (Optional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your favourite playstyle, formation (e.g. 4-2-1-3 Quick Counter), and competitive goals..."
              className="esports-input"
            />
          </div>

          <div className="space-y-2.5 pt-2 text-xs text-white/90">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requestOrganiserRole}
                onChange={(e) => setRequestOrganiserRole(e.target.checked)}
                className="mt-0.5 accent-brand-yellow"
              />
              <span>
                Also enable <strong>Tournament Organiser</strong> access on my account so I can
                create and manage community competitions.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 accent-brand-yellow"
              />
              <span>
                I confirm that I meet the minimum age eligibility requirement (13+ years) to
                participate on eFootball Kenya. *
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 accent-brand-yellow"
              />
              <span>
                I accept the{" "}
                <Link href="/terms" className="text-brand-yellow underline">
                  Terms of Participation
                </Link>
                ,{" "}
                <Link href="/fair-play" className="text-brand-yellow underline">
                  Fair Play Charter
                </Link>
                , and{" "}
                <Link href="/privacy" className="text-brand-yellow underline">
                  Privacy Policy
                </Link>
                . *
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-yellow w-full py-3.5 text-base"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? "Creating Profile..." : "Create Player Account"}
          </button>
        </form>

        <p className="text-center text-xs text-brand-grey pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-yellow font-bold hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
