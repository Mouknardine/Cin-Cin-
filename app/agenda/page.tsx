import type { Metadata } from "next";
import { AgendaView } from "@/components/agenda/AgendaView";
import { getScreenings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Agenda — Zinéma",
  description: "Toutes les séances du Zinéma, jour par jour.",
};

export default async function AgendaPage() {
  const screenings = await getScreenings();

  return (
    <div className="py-8 md:py-12">
      <div className="px-4 pb-8 md:px-8 md:pb-10">
        <p className="font-display text-xs tracking-widen text-ink/50">02 — AGENDA</p>
        <h1 className="mt-3 font-display text-[16vw] leading-[0.85] tracking-tightest md:text-[6vw]">
          Les séances
        </h1>
      </div>
      <AgendaView screenings={screenings} />
    </div>
  );
}
