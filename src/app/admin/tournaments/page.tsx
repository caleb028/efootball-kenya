import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Tournament Governance | Admin | eFootball Kenya",
};

export default function AdminTournamentsPage() {
  return <AdminDashboardClient activeSection="tournaments" />;
}
