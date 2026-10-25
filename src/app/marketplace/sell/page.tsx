"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, AlertCircle, ShieldCheck } from "lucide-react";
import { MARKETPLACE_PERMITTED_CATEGORIES } from "@/lib/constants/kenya";

export default function SellListingPage() {
  const router = useRouter();
  const [categorySlug, setCategorySlug] = useState("gaming-coaching");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceKes, setPriceKes] = useState("1500");
  const [fulfilmentTerms, setFulfilmentTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_LISTING",
          categorySlug,
          title,
          description,
          priceKes: Number(priceKes),
          fulfilmentTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish listing.");
      } else {
        router.push(`/marketplace/${data.listing.id}`);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <Link href="/marketplace" className="text-xs font-bold text-brand-yellow hover:underline">
          ← Back to Marketplace
        </Link>
        <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase text-white mt-1">
          Seller Dashboard — Create Permitted Listing
        </h1>
        <p className="text-xs text-brand-grey mt-1">
          Offer coaching, training sessions, gaming accessories, or merchandise priced in KES.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/60 text-xs text-brand-grey flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
        <span>
          <strong>Compliance Filter Active:</strong> Do not list eFootball game accounts, Konami ID
          logins, or prohibited digital currency transfers. Violations are automatically rejected.
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-brand-error/20 border border-brand-error text-xs text-white flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-brand-error shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="esports-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Permitted Category *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="esports-input"
            >
              {MARKETPLACE_PERMITTED_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
              Price in KES *
            </label>
            <input
              type="number"
              min={50}
              max={500000}
              required
              value={priceKes}
              onChange={(e) => setPriceKes(e.target.value)}
              className="esports-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
            Listing Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 1-on-1 Tactical Formation & Pressing Coaching (60 Mins)"
            className="esports-input"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
            Detailed Description *
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what is included, target skill level, or product specifications..."
            className="esports-input"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-brand-grey mb-1.5">
            Fulfilment & Delivery Terms *
          </label>
          <textarea
            rows={2}
            required
            value={fulfilmentTerms}
            onChange={(e) => setFulfilmentTerms(e.target.value)}
            placeholder="e.g. Scheduled within 24 hours via Discord/PlayStation Party, or CBD pickup in Nairobi."
            className="esports-input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-yellow w-full py-3">
          {loading ? "Publishing Listing..." : "Publish Permitted Listing"}
        </button>
      </form>
    </div>
  );
}
