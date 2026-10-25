import React from "react";
import { OrganiserDashboardClient } from "@/components/organiser/OrganiserDashboardClient";

export const metadata = {
  title: "Manage Tournaments | Organiser Hub | eFootball Kenya",
};

export default function OrganiserTournamentsPage() {
  return <OrganiserDashboardClient activeSection="tournaments" />;
}
