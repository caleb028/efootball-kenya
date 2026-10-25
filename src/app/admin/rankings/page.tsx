import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "National Rankings Administration | Admin | eFootball Kenya",
};

export default function AdminRankingsPage() {
  return <AdminDashboardClient activeSection="rankings" />;
}
