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
  const user = getCurrentUser();
  const profile = getPlayerProfileByUsername(params.username, user?.id);
  if (!profile) notFound();
  return <PlayerProfileClient profile={profile} currentUser={user} />;
}
