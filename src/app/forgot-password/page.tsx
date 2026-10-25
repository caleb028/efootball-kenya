"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setResetToken(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed.");
      } else {
        setMessage(data.message);
        if (data.resetTokenPreview) {
          setResetToken(data.resetTokenPreview);
        }
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
          <KeyRound className="w-10 h-10 text-brand-yellow mx-auto" />
          <h1 className="font-display font-bold text-3xl uppercase text-white">
            Password Recovery
          </h1>
          <p className="text-xs text-brand-grey">
            Enter your account email to generate a secure password reset token.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-lg bg-brand-success/20 border border-brand-success text-xs text-white space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-success shrink-0" />
              <span>{message}</span>
            </div>
            {resetToken && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-[11px] text-brand-grey mb-1">
                  Local Dev Reset Link (SMTP not configured):
                </p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="text-brand-yellow font-bold underline break-all"
                >
                  Proceed to Reset Password →
                </Link>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-brand-error/20 border border-brand-error text-xs text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-error shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              Account Email
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
          <button type="submit" disabled={loading} className="btn-yellow w-full">
            {loading ? "Generating Reset Token..." : "Send Password Reset"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs text-brand-yellow hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
