import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Disputes & Appeals Tribunal | Admin | eFootball Kenya",
};

export default function AdminDisputesPage() {
  return <AdminDashboardClient activeSection="disputes" />;
}
