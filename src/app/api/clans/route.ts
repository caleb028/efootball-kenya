import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  listClans,
  createClan,
  requestToJoinClan,
  manageClanMember,
  postClanAnnouncement,
} from "@/lib/services/clans-community";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clans = listClans({
    county: searchParams.get("county") || undefined,
    search: searchParams.get("q") || undefined,
  });
  return NextResponse.json({ clans });
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "CREATE");

    if (action === "CREATE") {
      const clan = createClan({
        founder: user,
        name: String(body.name || ""),
        tag: String(body.tag || ""),
        county: String(body.county || user.county),
        description: String(body.description || ""),
      });
      return NextResponse.json({ clan, message: `Clan [${clan.tag}] ${clan.name} created!` });
    }

    if (action === "JOIN") {
      requestToJoinClan(String(body.clanIdOrSlug || ""), user);
      return NextResponse.json({
        ok: true,
        message: "Join request submitted to Clan Leadership.",
      });
    }

    if (action === "MANAGE_MEMBER") {
      const clan = manageClanMember({
        clanIdOrSlug: String(body.clanIdOrSlug || ""),
        actor: user,
        targetUserId: String(body.targetUserId || ""),
        action: body.memberAction,
      });
      return NextResponse.json({ clan, message: "Clan membership updated." });
    }

    if (action === "ANNOUNCEMENT") {
      postClanAnnouncement({
        clanIdOrSlug: String(body.clanIdOrSlug || ""),
        author: user,
        title: String(body.title || ""),
        content: String(body.content || ""),
      });
      return NextResponse.json({ ok: true, message: "Clan announcement posted." });
    }

    return NextResponse.json({ error: "Unsupported clan action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Action failed." }, { status: 400 });
  }
}
