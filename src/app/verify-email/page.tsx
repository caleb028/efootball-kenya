"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="esports-card p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <MailCheck className="w-10 h-10 text-brand-yellow mx-auto" />
          <h1 className="font-display font-bold text-3xl uppercase text-white">
            Verify Your Email
          </h1>
          <p className="text-xs text-brand-grey">
            Enter your email verification token to verify your eFootball Kenya account.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-lg bg-brand-success/20 border border-brand-success text-xs text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-success shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-brand-error/20 border border-brand-error text-xs text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-error shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              Verification Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste verification token"
              className="esports-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-yellow w-full">
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/dashboard" className="text-xs text-brand-yellow hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
