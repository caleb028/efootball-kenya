import React from "react";
import { notFound } from "next/navigation";
import { getMarketplaceListingById } from "@/lib/services/marketplace-finance-admin";
import { getCurrentUser } from "@/lib/services/auth";
import { ListingDetailClient } from "@/components/marketplace/ListingDetailClient";

export default function MarketplaceListingPage({
  params,
}: {
  params: { listingId: string };
}) {
  let listing = null;
  try {
    listing = getMarketplaceListingById(params.listingId);
  } catch (err) {
    console.error("MarketplaceListingPage error:", err);
  }
  if (!listing) notFound();
  let user = null;
  try {
    user = getCurrentUser();
  } catch {}
  return <ListingDetailClient listing={listing} currentUser={user} />;
}
