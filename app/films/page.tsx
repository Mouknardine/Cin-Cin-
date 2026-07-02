import type { Metadata } from "next";
import { FilmsGrid } from "@/components/film/FilmsGrid";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Films — Zinéma",
  description: "La programmation actuelle et à venir du Zinéma, à Lausanne.",
};

export default function FilmsPage() {
  return (
    <div className="py-8 md:py-12">
      <PageHeader eyebrow="01 — FILMS" title="À l'affiche" />
      <FilmsGrid />
    </div>
  );
}
