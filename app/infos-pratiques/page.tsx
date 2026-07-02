import type { Metadata } from "next";
import { PracticalInfo } from "@/components/practical/PracticalInfo";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Infos pratiques — Zinéma",
  description: "Adresse, horaires et accès du Zinéma à Lausanne.",
};

export default function InfosPratiquesPage() {
  return (
    <div className="py-8 md:py-12">
      <PageHeader eyebrow="05 — INFOS PRATIQUES" title="Nous trouver" />
      <PracticalInfo />
    </div>
  );
}
