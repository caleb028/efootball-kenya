import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Sponsors & Campaigns | Admin | eFootball Kenya",
};

export default function AdminSponsorsPage() {
  return <AdminDashboardClient activeSection="sponsors" />;
}
