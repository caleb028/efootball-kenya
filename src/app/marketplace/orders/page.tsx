import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { listMarketplaceOrdersForUser } from "@/lib/services/marketplace-finance-admin";
import { Package } from "lucide-react";

export default function MarketplaceOrdersPage() {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const orders = listMarketplaceOrdersForUser(user);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-brand-royal/40 pb-5">
        <div>
          <Link href="/marketplace" className="text-xs font-bold text-brand-yellow hover:underline">
            ← Back to Marketplace
          </Link>
          <h1 className="font-display font-bold text-3xl uppercase text-white mt-1">
            My Marketplace Orders ({orders.length})
          </h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="esports-card p-10 text-center space-y-3">
          <Package className="w-10 h-10 text-brand-yellow mx-auto" />
          <div className="font-display font-bold text-xl uppercase text-white">
            No Marketplace Orders Yet
          </div>
          <Link href="/marketplace" className="btn-yellow text-xs">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/marketplace/orders/${o.id}`}
              className="esports-card-hover p-5 flex items-center justify-between gap-4 block"
            >
              <div>
                <div className="text-xs text-brand-grey">
                  {o.categoryName} • Buyer: {o.buyerUsername} • Seller: {o.sellerUsername}
                </div>
                <div className="font-display font-bold text-xl text-white mt-0.5">
                  {o.listingTitle}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-lg text-brand-yellow">
                  KES {o.amountKes.toLocaleString()}
                </div>
                <span className="esports-badge-blue mt-1">{o.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
