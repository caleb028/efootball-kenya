import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Security Audit Trail & Analytics | Admin | eFootball Kenya",
};

export default function AdminAnalyticsPage() {
  return <AdminDashboardClient activeSection="analytics" />;
}
