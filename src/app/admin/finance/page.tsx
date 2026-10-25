import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Finance & Double-Entry Ledger | Admin | eFootball Kenya",
};

export default function AdminFinancePage() {
  return <AdminDashboardClient activeSection="finance" />;
}
