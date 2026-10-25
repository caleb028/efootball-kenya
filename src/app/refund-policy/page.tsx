import React from "react";

export const metadata = {
  title: "Refund, Cancellation & Dispute Policy | eFootball Kenya",
  description: "Policy governing marketplace orders, cancellations, and regulated payment compliance on eFootball Kenya.",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="badge-yellow mb-3 inline-block">MARKETPLACE & FINANCIAL POLICY</span>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white">
        Refund & Order Resolution Policy
      </h1>
      <p className="mt-2 text-xs text-ef-grey">
        Currency: Kenyan Shillings (KES) • Auditable Double-Entry Ledger Protection
      </p>

      <div className="card-esports mt-8 space-y-6 p-6 text-sm leading-relaxed text-ef-grey">
        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            1. Marketplace Order Lifecycle
          </h2>
          <p className="mt-2">
            Every marketplace order progresses through explicit tracked states: <code className="text-ef-yellow">PENDING</code> &rarr; <code className="text-ef-yellow">ACCEPTED</code> &rarr; <code className="text-ef-yellow">DELIVERED</code> &rarr; <code className="text-ef-yellow">CONFIRMED</code>. Buyers may cancel an order before fulfilment begins or open an order dispute if delivery terms are not met.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            2. Cancelled Tournaments
          </h2>
          <p className="mt-2">
            Community tournaments on eFootball Kenya are free-to-enter by default. Where regulated paid entry or sponsor passes are enabled under compliance feature flags, any cancelled event automatically triggers a full reversal in the double-entry KES ledger.
          </p>
        </section>
      </div>
    </div>
  );
}
