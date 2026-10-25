"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed.");
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
          <Lock className="w-10 h-10 text-brand-yellow mx-auto" />
          <h1 className="font-display font-bold text-3xl uppercase text-white">
            Set New Password
          </h1>
          <p className="text-xs text-brand-grey">
            Enter your reset token and choose a new password (min. 8 characters).
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Reset token"
              className="esports-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-grey mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="esports-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-yellow w-full">
            {loading ? "Updating Password..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs text-brand-yellow hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
