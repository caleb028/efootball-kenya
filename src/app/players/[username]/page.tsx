import React from "react";
import { notFound } from "next/navigation";
import { getPlayerProfileByUsername } from "@/lib/services/rankings-players";
import { getCurrentUser } from "@/lib/services/auth";
import { PlayerProfileClient } from "@/components/player/PlayerProfileClient";

export default function PlayerProfilePage({
  params,
}: {
  params: { username: string };
}) {
  let user = null;
  try {
    user = getCurrentUser();
  } catch {}

  let profile = null;
  try {
    profile = getPlayerProfileByUsername(params.username, user?.id);
  } catch (err) {
    console.error("PlayerProfilePage error:", err);
  }
  if (!profile) notFound();
  return <PlayerProfileClient profile={profile} currentUser={user} />;
}
