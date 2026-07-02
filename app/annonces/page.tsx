import type { Metadata } from "next";
import { AnnouncementsList } from "@/components/announcement/AnnouncementsList";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Annonces — Zinéma",
  description: "Nouveautés, cycles, brunchs-ciné et informations du Zinéma.",
};

export default function AnnoncesPage() {
  return (
    <div className="py-8 md:py-12">
      <PageHeader eyebrow="04 — ANNONCES" title="Ça se passe ici" />
      <AnnouncementsList />
    </div>
  );
}
