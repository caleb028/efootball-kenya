import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function MarketplaceSavedPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="border-b border-brand-royal/40 pb-5">
        <Link href="/marketplace" className="text-xs font-bold text-brand-yellow hover:underline">
          ← Back to Marketplace
        </Link>
        <h1 className="font-display font-bold text-3xl uppercase text-white mt-1">
          Saved Marketplace Listings
        </h1>
      </div>

      <div className="esports-card p-10 text-center space-y-3">
        <ShoppingBag className="w-10 h-10 text-brand-yellow mx-auto" />
        <p className="text-sm text-brand-grey">
          Browse the marketplace to bookmark coaching sessions and accessories.
        </p>
        <Link href="/marketplace" className="btn-yellow text-xs">
          Explore Marketplace
        </Link>
      </div>
    </div>
  );
}
