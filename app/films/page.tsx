import type { Metadata } from "next";
import { FilmsGrid } from "@/components/film/FilmsGrid";
import { getFilms } from "@/lib/content";

export const metadata: Metadata = {
  title: "Films — Zinéma",
  description: "La programmation actuelle et à venir du Zinéma, à Lausanne.",
};

export default async function FilmsPage() {
  const films = await getFilms();
  const sorted = [...films].sort((a, b) => a.status.localeCompare(b.status));

  return (
    <div className="py-8 md:py-12">
      <div className="px-4 pb-8 md:px-8 md:pb-12">
        <p className="font-display text-xs tracking-widen text-ink/50">01 — FILMS</p>
        <h1 className="mt-3 font-display text-[16vw] leading-[0.85] tracking-tightest md:text-[6vw]">
          À l&apos;affiche
        </h1>
      </div>
      <FilmsGrid films={sorted} />
    </div>
  );
}
