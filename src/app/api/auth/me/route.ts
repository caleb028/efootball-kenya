import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { updatePlayerProfile, markNotificationsRead } from "@/lib/services/rankings-players";

export async function GET() {
  const user = getCurrentUser();
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const body = await req.json();
    if (body.action === "MARK_NOTIFICATIONS_READ") {
      markNotificationsRead(user.id);
      return NextResponse.json({ ok: true });
    }
    updatePlayerProfile(user, {
      displayName: String(body.displayName || user.displayName),
      county: String(body.county || user.county),
      platform: String(body.platform || user.platform),
      efootballId: body.efootballId ? String(body.efootballId) : undefined,
      bio: body.bio ? String(body.bio) : undefined,
      university: body.university ? String(body.university) : undefined,
    });
    return NextResponse.json({ ok: true, message: "Profile updated." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 400 });
  }
}
