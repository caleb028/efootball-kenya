import React from "react";
import { OrganiserDashboardClient } from "@/components/organiser/OrganiserDashboardClient";

export const metadata = {
  title: "Tournament Control Room | Organiser Hub | eFootball Kenya",
};

export default function OrganiserTournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <OrganiserDashboardClient
      activeSection="detail"
      selectedTournamentSlug={params.id}
    />
  );
}
