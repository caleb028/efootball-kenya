import React from "react";
import { OrganiserDashboardClient } from "@/components/organiser/OrganiserDashboardClient";

export const metadata = {
  title: "Fixtures & Brackets | Organiser Hub | eFootball Kenya",
};

export default function OrganiserFixturesPage() {
  return <OrganiserDashboardClient activeSection="fixtures" />;
}
