import type { Metadata } from "next";
import { HistoryTimeline } from "@/components/history/HistoryTimeline";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Histoire — Zinéma",
  description: "Le Zinéma, cinéma indépendant à Lausanne, depuis 2001.",
};

export default function HistoirePage() {
  return (
    <div className="py-8 md:py-12">
      <PageHeader eyebrow="03 — HISTOIRE" title="Depuis 2001" />
      <HistoryTimeline />
    </div>
  );
}
