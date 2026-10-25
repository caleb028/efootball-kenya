import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  SESSION_COOKIE_NAME,
  checkRateLimit,
} from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`login:${ip}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { user, sessionToken } = await authenticateUser({
      identifier: String(body.identifier || ""),
      password: String(body.password || ""),
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const res = NextResponse.json({ user, message: "Logged in successfully." });
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Invalid credentials." },
      { status: 401 }
    );
  }
}
