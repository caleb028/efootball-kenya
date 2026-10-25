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
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const order = getMarketplaceOrderById(params.orderId, user);
  if (!order) notFound();
  return <OrderDetailClient order={order} currentUser={user} />;
}
