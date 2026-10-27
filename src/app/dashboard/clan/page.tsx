import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getPlayerDashboardData } from "@/lib/services/rankings-players";
import { PlayerDashboardClient } from "@/components/dashboard/PlayerDashboardClient";

export default function DashboardClanPage() {
  let user = null;
  try {
    user = getCurrentUser();
  } catch {}
  if (!user) redirect("/login");

  let data = null;
  try {
    data = getPlayerDashboardData(user);
  } catch (err) {
    console.error("DashboardClanPage error:", err);
  }
  return <PlayerDashboardClient user={user} dashboardData={data} initialSection="CLAN" />;
}
