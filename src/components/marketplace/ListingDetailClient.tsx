"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShoppingBag, Flag, CheckCircle2, AlertCircle } from "lucide-react";

export function ListingDetailClient({
  listing,
  currentUser,
}: {
  listing: any;
  currentUser: any | null;
}) {
  const router = useRouter();
  const [buyerNotes, setBuyerNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ORDER",
          listingId: listing.id,
          buyerNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "Failed to place order." });
      } else {
        router.push(`/marketplace/orders/${data.orderId}`);
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleReportListing() {
    if (!currentUser) return;
    await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REPORT",
        targetType: "LISTING",
        targetId: listing.id,
        reason: "Marketplace listing review requested",
      }),
    });
    setFeedback({
      type: "ok",
      text: "Listing reported to Marketplace Moderators for inspection.",
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link href="/marketplace" className="text-xs font-bold text-brand-yellow hover:underline">
          ← Back to Marketplace
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <span className="esports-badge-blue mb-2">{listing.categoryName}</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase text-white">
              {listing.title}
            </h1>
          </div>
          <div className="font-display font-bold text-4xl text-brand-yellow">
            KES {listing.priceKes.toLocaleString()}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            feedback.type === "ok"
              ? "bg-brand-success/20 border-brand-success text-white"
              : "bg-brand-error/20 border-brand-error text-white"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="esports-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl uppercase text-brand-yellow">
              Service / Item Description
            </h2>
            <p className="text-sm text-white/90 whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>

          <div className="esports-card p-6 space-y-3">
            <h3 className="font-display font-bold text-lg uppercase text-white">
              Fulfilment Terms & Buyer Protection
            </h3>
            <p className="text-xs text-brand-grey whitespace-pre-line">
              {listing.fulfilmentTerms}
            </p>
            <div className="p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 text-xs text-brand-grey">
              <strong className="text-brand-yellow">Buyer Protection Notice:</strong> Track order
              status from Pending → Accepted → In Progress → Delivered → Confirmed. Regulated
              M-Pesa escrow/stored-value payments remain disabled until provider and legal
              clearances are active.
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="esports-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xl uppercase text-white">
              Seller Information
            </h3>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-brand-grey">Seller Username:</span>
                <Link
                  href={`/players/${listing.sellerUsername}`}
                  className="text-brand-yellow font-bold hover:underline"
                >
                  {listing.sellerUsername}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-grey">County:</span>
                <span className="text-white">{listing.sellerCounty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-grey">Completed Orders:</span>
                <span className="text-white font-bold">{listing.sellerTotalSales}</span>
              </div>
            </div>

            {currentUser && currentUser.id !== listing.sellerUserId ? (
              <form onSubmit={handleOrder} className="space-y-3 pt-4 border-t border-brand-royal/30">
                <label className="block text-xs font-bold uppercase text-brand-grey">
                  Booking / Order Notes
                </label>
                <textarea
                  rows={2}
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder="Preferred time (EAT) or delivery instructions..."
                  className="esports-input text-xs"
                />
                <button type="submit" disabled={loading} className="btn-yellow w-full py-3">
                  <ShoppingBag className="w-4 h-4" />
                  {loading
                    ? "Creating Order..."
                    : `Place Order (KES ${listing.priceKes.toLocaleString()})`}
                </button>
              </form>
            ) : !currentUser ? (
              <Link href="/login" className="btn-yellow w-full text-center block">
                Sign In to Order
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleReportListing}
              className="inline-flex items-center gap-1.5 text-xs text-brand-grey hover:text-brand-error pt-2"
            >
              <Flag className="w-3.5 h-3.5" />
              Report Listing to Moderators
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
