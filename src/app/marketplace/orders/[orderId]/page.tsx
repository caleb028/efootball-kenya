import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getMarketplaceOrderById } from "@/lib/services/marketplace-finance-admin";
import { OrderDetailClient } from "@/components/marketplace/OrderDetailClient";

export default function MarketplaceOrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  let user = null;
  try {
    user = getCurrentUser();
  } catch {}
  if (!user) redirect("/login");

  let order = null;
  try {
    order = getMarketplaceOrderById(params.orderId, user);
  } catch (err) {
    console.error("MarketplaceOrderDetailPage error:", err);
  }
  if (!order) notFound();
  return <OrderDetailClient order={order} currentUser={user} />;
}
