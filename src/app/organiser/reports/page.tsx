import React from "react";
import { OrganiserDashboardClient } from "@/components/organiser/OrganiserDashboardClient";

export const metadata = {
  title: "Tournament Reports & CSV Exports | Organiser Hub | eFootball Kenya",
};

export default function OrganiserReportsPage() {
  return <OrganiserDashboardClient activeSection="reports" />;
}
