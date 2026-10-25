import React from "react";
import { OrganiserDashboardClient } from "@/components/organiser/OrganiserDashboardClient";

export const metadata = {
  title: "Organiser Dashboard | eFootball Kenya",
  description: "Create and manage official Kenyan eFootball tournaments, brackets, and match reports.",
};

export default function OrganiserOverviewPage() {
  return <OrganiserDashboardClient activeSection="overview" />;
}
