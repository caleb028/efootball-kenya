import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Clans Administration | Admin | eFootball Kenya",
};

export default function AdminClansPage() {
  return <AdminDashboardClient activeSection="clans" />;
}
