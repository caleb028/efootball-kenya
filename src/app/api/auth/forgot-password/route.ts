import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, checkRateLimit } from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(`forgot:${ip}`, 5, 60_000).allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const token = createPasswordResetToken(String(body.email || ""));
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    return NextResponse.json({
      ok: true,
      smtpConfigured,
      // When SMTP is not configured in local dev, return the reset link path so testing works without fake OTP
      resetTokenPreview: !smtpConfigured ? token : undefined,
      message: smtpConfigured
        ? "If an account exists for that email, a password reset link has been sent."
        : "Password reset token generated in database (configure SMTP_HOST in .env for email delivery).",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Request failed." }, { status: 400 });
  }
}
