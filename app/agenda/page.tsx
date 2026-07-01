import type { Metadata } from "next";
import { AgendaView } from "@/components/agenda/AgendaView";
import { PageHeader } from "@/components/layout/PageHeader";
import { getScreenings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Agenda — Zinéma",
  description: "Toutes les séances du Zinéma, jour par jour.",
};

export default async function AgendaPage() {
  const screenings = await getScreenings();

  return (
    <div className="py-8 md:py-12">
      <PageHeader eyebrow="02 — AGENDA" title="Les séances" />
      <AgendaView screenings={screenings} />
    </div>
  );
}
