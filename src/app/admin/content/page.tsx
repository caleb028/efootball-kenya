import React from "react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Editorial & Media Management | Admin | eFootball Kenya",
};

export default function AdminContentPage() {
  return <AdminDashboardClient activeSection="content" />;
}
