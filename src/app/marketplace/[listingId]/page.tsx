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
  const listing = getMarketplaceListingById(params.listingId);
  if (!listing) notFound();
  const user = getCurrentUser();
  return <ListingDetailClient listing={listing} currentUser={user} />;
}
