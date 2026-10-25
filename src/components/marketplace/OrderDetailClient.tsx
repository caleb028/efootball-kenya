"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShieldCheck, CheckCircle2 } from "lucide-react";

export function OrderDetailClient({
  order: initialOrder,
  currentUser,
}: {
  order: any;
  currentUser: any;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [deliveryNotes, setDeliveryNotes] = useState(initialOrder.deliveryNotes || "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSeller = currentUser.id === order.sellerUserId;
  const isBuyer = currentUser.id === order.buyerId;

  async function updateStatus(nextStatus: string) {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ORDER_STATUS",
          orderId: order.id,
          nextStatus,
          deliveryNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        setFeedback(data.message);
        router.refresh();
      } else {
        setFeedback(data.error || "Failed to update status.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-brand-royal/40 pb-5">
        <div>
          <Link
            href="/marketplace/orders"
            className="text-xs font-bold text-brand-yellow hover:underline"
          >
            ← Back to My Orders
          </Link>
          <h1 className="font-display font-bold text-3xl uppercase text-white mt-1">
            Order #{order.id.slice(-8)} • {order.listingTitle}
          </h1>
        </div>
        <span className="esports-badge-yellow text-sm">{order.status}</span>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-brand-navy border border-brand-yellow text-xs text-white">
          {feedback}
        </div>
      )}

      <div className="esports-card p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-brand-grey">Buyer</div>
            <div className="font-bold text-white text-sm">{order.buyerUsername}</div>
          </div>
          <div>
            <div className="text-brand-grey">Seller</div>
            <div className="font-bold text-white text-sm">{order.sellerUsername}</div>
          </div>
          <div>
            <div className="text-brand-grey">Amount</div>
            <div className="font-display font-bold text-brand-yellow text-lg">
              KES {order.amountKes.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-brand-grey">Status</div>
            <div className="font-bold text-white text-sm">{order.status}</div>
          </div>
        </div>

        {order.buyerNotes && (
          <div className="p-3.5 rounded-lg bg-brand-navy border border-brand-royal/40 text-xs">
            <strong className="text-brand-yellow">Buyer Notes:</strong> {order.buyerNotes}
          </div>
        )}

        {isSeller && (
          <div className="pt-4 border-t border-brand-royal/30 space-y-3">
            <h2 className="font-display font-bold text-lg uppercase text-brand-yellow">
              Seller Fulfilment Controls
            </h2>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Provide session link, coaching schedule, or delivery details..."
              className="esports-input text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => updateStatus("ACCEPTED")}
                className="btn-royal text-xs py-2 px-3"
              >
                Mark Accepted
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => updateStatus("IN_PROGRESS")}
                className="btn-royal text-xs py-2 px-3"
              >
                Mark In Progress
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => updateStatus("DELIVERED")}
                className="btn-yellow text-xs py-2 px-3"
              >
                Mark Delivered
              </button>
            </div>
          </div>
        )}

        {isBuyer && (
          <div className="pt-4 border-t border-brand-royal/30 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => updateStatus("CONFIRMED")}
              className="btn-yellow text-xs py-2 px-4"
            >
              Confirm Delivery Completed
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => updateStatus("DISPUTED")}
              className="btn-outline text-xs py-2 px-4"
            >
              Open Order Dispute
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
