import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Marketplace Moderation | Admin | eFootball Kenya",
};

export default function AdminMarketplacePage() {
  return <AdminDashboardClient activeSection="marketplace" />;
}
