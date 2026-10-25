"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LogIn, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
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
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="esports-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo variant="compact" size="md" />
          </div>
          <h1 className="font-display font-bold text-3xl uppercase text-white">
            Player Sign In
          </h1>
          <p className="text-xs text-brand-grey">
            Access your Match Rooms, Tournaments, and Player Dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-brand-error/20 border border-brand-error text-xs text-white flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-brand-error shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. NairobiKing or player@domain.co.ke"
              className="esports-input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-yellow hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="esports-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-yellow w-full py-3 text-base"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Signing In..." : "Sign In to eFootball Kenya"}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-brand-royal/40" />
          <span className="flex-shrink mx-3 text-xs text-brand-grey uppercase">or</span>
          <div className="flex-grow border-t border-brand-royal/40" />
        </div>

        <a
          href="/api/auth/google"
          className="btn-outline w-full text-xs py-2.5 text-center block"
        >
          Continue with Google OAuth
        </a>

        <p className="text-center text-xs text-brand-grey pt-2">
          New to eFootball Kenya?{" "}
          <Link href="/register" className="text-brand-yellow font-bold hover:underline">
            Create Player Account
          </Link>
        </p>
      </div>
    </div>
  );
}
