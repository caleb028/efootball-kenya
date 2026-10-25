import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Matches Oversight | Admin | eFootball Kenya",
};

export default function AdminMatchesPage() {
  return <AdminDashboardClient activeSection="matches" />;
}
