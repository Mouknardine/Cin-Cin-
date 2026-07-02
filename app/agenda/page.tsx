import type { Metadata } from "next";
import { AgendaView } from "@/components/agenda/AgendaView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Agenda — Zinéma",
  description: "Toutes les séances du Zinéma, jour par jour.",
};

export default function AgendaPage() {
  return (
    <div className="py-8 md:py-12">
      <PageHeader eyebrow="02 — AGENDA" title="Les séances" />
      <AgendaView />
    </div>
  );
}
