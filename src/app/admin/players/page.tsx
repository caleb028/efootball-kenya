import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Player Moderation & Roles | Admin | eFootball Kenya",
};

export default function AdminPlayersPage() {
  return <AdminDashboardClient activeSection="players" />;
}
