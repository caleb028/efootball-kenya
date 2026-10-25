import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ok = await resetPasswordWithToken(
      String(body.token || ""),
      String(body.newPassword || "")
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid, expired, or already used password reset token." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: "Password updated and existing sessions revoked. You may now log in.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Password reset failed." }, { status: 400 });
  }
}
