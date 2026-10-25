import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Administrator Console | eFootball Kenya",
  description: "National esports governance, moderation, dispute resolution, and compliance dashboard.",
};

export default function AdminOverviewPage() {
  return <AdminDashboardClient activeSection="overview" />;
}
