import React from "react";
import { OrganiserDashboardClient } from "@/components/organiser/OrganiserDashboardClient";

export const metadata = {
  title: "Player Registrations & Waitlist | Organiser Hub | eFootball Kenya",
};

export default function OrganiserRegistrationsPage() {
  return <OrganiserDashboardClient activeSection="registrations" />;
}
