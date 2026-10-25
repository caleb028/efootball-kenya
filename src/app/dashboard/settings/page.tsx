import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getPlayerDashboardData } from "@/lib/services/rankings-players";
import { PlayerDashboardClient } from "@/components/dashboard/PlayerDashboardClient";

export default function DashboardSettingsPage() {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const data = getPlayerDashboardData(user);
  return <PlayerDashboardClient user={user} dashboardData={data} initialSection="SETTINGS" />;
}
