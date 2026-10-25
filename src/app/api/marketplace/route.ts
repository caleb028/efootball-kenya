import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  listMarketplaceListings,
  createMarketplaceListing,
  createMarketplaceOrder,
  listMarketplaceOrdersForUser,
  updateMarketplaceOrderStatus,
} from "@/lib/services/marketplace-finance-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "listings";

  if (mode === "orders") {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }
    const orders = listMarketplaceOrdersForUser(user);
    return NextResponse.json({ orders });
  }

  const listings = listMarketplaceListings({
    categorySlug: searchParams.get("category") || undefined,
    search: searchParams.get("q") || undefined,
  });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "CREATE_LISTING");

    if (action === "CREATE_LISTING") {
      const listing = createMarketplaceListing({
        user,
        categorySlug: String(body.categorySlug || "gaming-coaching"),
        title: String(body.title || ""),
        description: String(body.description || ""),
        priceKes: Number(body.priceKes),
        fulfilmentTerms: String(body.fulfilmentTerms || ""),
      });
      return NextResponse.json({
        listing,
        message: "Permitted listing published to the eFootball Kenya Marketplace!",
      });
    }

    if (action === "CREATE_ORDER") {
      const orderId = createMarketplaceOrder({
        listingId: String(body.listingId || ""),
        buyer: user,
        buyerNotes: body.buyerNotes ? String(body.buyerNotes) : undefined,
      });
      return NextResponse.json({
        orderId,
        message: "Order created! View order details for fulfilment coordination.",
      });
    }

    if (action === "UPDATE_ORDER_STATUS") {
      const order = updateMarketplaceOrderStatus({
        orderId: String(body.orderId || ""),
        actor: user,
        nextStatus: body.nextStatus,
        deliveryNotes: body.deliveryNotes ? String(body.deliveryNotes) : undefined,
      });
      return NextResponse.json({
        order,
        message: `Order status updated to ${order.status}.`,
      });
    }

    return NextResponse.json({ error: "Unsupported marketplace action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
