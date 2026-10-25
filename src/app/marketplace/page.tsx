import React from "react";
import Link from "next/link";
import { ShoppingBag, Plus, ShieldCheck, AlertTriangle, Package } from "lucide-react";
import { listMarketplaceListings } from "@/lib/services/marketplace-finance-admin";
import { MARKETPLACE_PERMITTED_CATEGORIES } from "@/lib/constants/kenya";

export default function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const listings = listMarketplaceListings({
    categorySlug: searchParams.category,
    search: searchParams.q,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-royal/40 pb-6">
        <div>
          <span className="esports-badge-yellow mb-2">Permitted Gaming Services • KES</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase text-white">
            eFootball Kenya Marketplace
          </h1>
          <p className="text-sm text-brand-grey mt-1">
            Discover verified coaching, tactical training sessions, controllers, cooling fans,
            esports jerseys, and approved broadcast services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/marketplace/orders" className="btn-outline text-xs py-2.5 px-4">
            <Package className="w-4 h-4" />
            My Orders
          </Link>
          <Link href="/marketplace/sell" className="btn-yellow text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" />
            Create Seller Listing
          </Link>
        </div>
      </div>

      {/* Compliance & Prohibited Items Notice (Section 17) */}
      <div className="p-4 rounded-xl bg-brand-navy border border-brand-royal/60 flex items-start gap-3 text-xs text-brand-grey">
        <ShieldCheck className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Permitted Listings Policy:</strong> Only approved gaming
          coaching, training sessions, physical gaming accessories, merchandise, and creative
          services are permitted.{" "}
          <span className="text-brand-yellow">
            eFootball account trading, Konami ID credential handovers, and unauthorised in-game
            asset transfers are strictly prohibited and automatically blocked.
          </span>
        </div>
      </div>

      {/* Category & Search Filter */}
      <form
        method="GET"
        action="/marketplace"
        className="esports-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="Search coaching, controllers, clan jerseys..."
          className="esports-input"
        />
        <select
          name="category"
          defaultValue={searchParams.category || "ALL"}
          className="esports-input"
        >
          <option value="ALL">All Permitted Categories</option>
          {MARKETPLACE_PERMITTED_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-royal w-full">
          Filter Marketplace
        </button>
      </form>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-brand-yellow mx-auto" />
          <h2 className="font-display font-bold text-2xl uppercase text-white">
            No Marketplace Listings Yet
          </h2>
          <p className="text-sm text-brand-grey max-w-md mx-auto">
            Are you a high-rated eFootball coach, tournament graphic designer, or gaming hardware
            vendor in Kenya? Publish your first permitted listing!
          </p>
          <Link href="/marketplace/sell" className="btn-yellow text-xs">
            Publish Permitted Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}`}
              className="esports-card-hover p-5 flex flex-col justify-between gap-4 block"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="esports-badge-blue">{l.categoryName}</span>
                  <span className="text-brand-success font-bold uppercase">
                    {l.availability.replace(/_/g, " ")}
                  </span>
                </div>
                <h2 className="font-display font-bold text-2xl text-white leading-snug">
                  {l.title}
                </h2>
                <p className="text-xs text-brand-grey line-clamp-2">{l.description}</p>
              </div>

              <div className="pt-4 border-t border-brand-royal/30 flex items-center justify-between">
                <div>
                  <div className="text-xs text-brand-grey">Seller</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    {l.sellerUsername} ({l.sellerCounty})
                    {l.sellerVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-brand-grey">Price</div>
                  <div className="font-display font-bold text-2xl text-brand-yellow">
                    KES {l.priceKes.toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
