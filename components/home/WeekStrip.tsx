import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { formatDayLabel } from "@/lib/dates";
import type { Screening } from "@/lib/types";

export function WeekStrip({ screenings }: { screenings: Screening[] }) {
  const upcoming = screenings.filter((s) => s.status !== "annule").slice(0, 6);
  if (upcoming.length === 0) return null;

  return (
    <section className="border-b border-ink/15 bg-ink px-4 py-10 text-paper md:px-8 md:py-14">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xs tracking-widen text-paper/60">CETTE SEMAINE</p>
        <Link href="/agenda" className="underline-hover font-display text-xs tracking-widen">
          Agenda complet →
        </Link>
      </div>
      <ul className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-3">
        {upcoming.map((s, i) => (
          <Reveal key={s._id} delay={i * 0.05}>
            <li className="border-t border-paper/20 pt-3">
              <p className="font-display text-[10px] tracking-widen text-paper/50">
                {formatDayLabel(s.date)} — {s.time} — {s.room}
              </p>
              <Link
                href={s.film ? `/films/${s.film.slug}` : "/agenda"}
                className="underline-hover mt-1 block font-display text-xl leading-tight tracking-tightest md:text-2xl"
              >
                {s.film?.title || "Séance"}
              </Link>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
