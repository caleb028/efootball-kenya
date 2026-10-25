import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  getFinanceAndComplianceStatus,
  createMpesaPaymentRequest,
} from "@/lib/services/marketplace-finance-admin";

export async function GET() {
  const status = getFinanceAndComplianceStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const res = createMpesaPaymentRequest({
      user,
      idempotencyKey: String(body.idempotencyKey || `${user.id}-${Date.now()}`),
      purpose: body.purpose || "MARKETPLACE_ORDER",
      referenceId: String(body.referenceId || ""),
      phoneNumber: String(body.phoneNumber || ""),
      amountKes: Number(body.amountKes || 0),
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Payment request failed." }, { status: 400 });
  }
}
