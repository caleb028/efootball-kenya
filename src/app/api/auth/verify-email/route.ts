import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ok = verifyEmailToken(String(body.token || ""));
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid, expired, or already used verification token." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, message: "Email verified successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Verification failed." }, { status: 400 });
  }
}
