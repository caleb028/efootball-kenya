import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Compliance & System Feature Flags | Admin | eFootball Kenya",
};

export default function AdminSettingsPage() {
  return <AdminDashboardClient activeSection="settings" />;
}
