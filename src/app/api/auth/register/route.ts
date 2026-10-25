import { NextRequest, NextResponse } from "next/server";
import {
  registerUser,
  createSessionForUser,
  SESSION_COOKIE_NAME,
  checkRateLimit,
  UserRoleName,
} from "@/lib/services/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`register:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const db = getDb();
    const existingAdmins = db
      .prepare(`SELECT COUNT(*) as cnt FROM user_roles WHERE role = 'SUPER_ADMIN'`)
      .get() as { cnt: number };

    // If no Super Admin exists yet in the database, bootstrap the first registered user
    const initialRoles: UserRoleName[] =
      Number(existingAdmins.cnt) === 0
        ? [
            "PLAYER",
            "ORGANISER",
            "MODERATOR",
            "TOURNAMENT_ADMIN",
            "FINANCE_ADMIN",
            "CONTENT_EDITOR",
            "SUPER_ADMIN",
          ]
        : body.requestOrganiserRole
        ? ["PLAYER", "ORGANISER"]
        : ["PLAYER"];

    const { user, verificationToken } = await registerUser({
      username: String(body.username || ""),
      displayName: String(body.displayName || body.username || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
      county: String(body.county || "Nairobi"),
      platform: String(body.platform || "MOBILE"),
      efootballId: body.efootballId ? String(body.efootballId) : undefined,
      bio: body.bio ? String(body.bio) : undefined,
      university: body.university ? String(body.university) : undefined,
      ageConfirmed: Boolean(body.ageConfirmed),
      termsAccepted: Boolean(body.termsAccepted),
      initialRoles,
    });

    const sessionToken = createSessionForUser(
      user.id,
      ip,
      req.headers.get("user-agent") || undefined
    );

    const res = NextResponse.json({
      user,
      verificationToken,
      message: "Account created successfully.",
    });

    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Registration failed." },
      { status: 400 }
    );
  }
}
