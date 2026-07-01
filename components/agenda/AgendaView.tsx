"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { groupByDate } from "@/lib/agenda";
import { formatDayHeading } from "@/lib/dates";
import type { Screening } from "@/lib/types";

const statusText: Record<Screening["status"], string> = {
  disponible: "",
  complet: "Complet",
  annule: "Annulé",
};

export function AgendaView({ screenings }: { screenings: Screening[] }) {
  const days = useMemo(() => groupByDate(screenings), [screenings]);
  const [activeDate, setActiveDate] = useState(days[0]?.date);
  const [mode, setMode] = useState<"jour" | "semaine">("jour");

  const activeDay = days.find((d) => d.date === activeDate) || days[0];

  if (days.length === 0) {
    return (
      <p className="px-4 py-16 text-center font-display text-sm tracking-widen text-ink/60 md:px-8">
        Aucune séance programmée pour le moment.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-4 pb-4 md:px-8">
        <div className="flex gap-2">
          <ModeButton active={mode === "jour"} onClick={() => setMode("jour")}>
            Jour
          </ModeButton>
          <ModeButton active={mode === "semaine"} onClick={() => setMode("semaine")}>
            Semaine
          </ModeButton>
        </div>
      </div>

      {mode === "jour" ? (
        <>
          <div className="scrollbar-none flex gap-1 overflow-x-auto border-y border-ink/15 px-4 py-2 md:px-8">
            {days.map((d) => {
              const date = parseISO(d.date);
              const active = d.date === activeDay?.date;
              return (
                <button
                  key={d.date}
                  onClick={() => setActiveDate(d.date)}
                  className={`flex shrink-0 flex-col items-center px-4 py-2 font-display transition-colors duration-200 ${
                    active ? "bg-ink text-paper" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  <span className="text-[10px] tracking-widen">
                    {isToday(date) ? "AUJ." : format(date, "EEE", { locale: fr }).toUpperCase()}
                  </span>
                  <span className="text-lg tracking-tightest">{format(date, "dd")}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay?.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
              className="px-4 py-8 md:px-8"
            >
              <p className="mb-6 font-display text-2xl capitalize tracking-tightest md:text-3xl">
                {activeDay ? formatDayHeading(activeDay.date) : ""}
              </p>
              <ul className="flex flex-col">
                {activeDay?.screenings.map((s) => (
                  <li
                    key={s._id}
                    className="grid grid-cols-[64px_1fr] items-center gap-4 border-t border-ink/15 py-4 last:border-b md:grid-cols-[96px_1fr_auto]"
                  >
                    <span className="font-display text-2xl tracking-tightest md:text-3xl">
                      {s.time}
                    </span>
                    <div>
                      <Link
                        href={s.film ? `/films/${s.film.slug}` : "/films"}
                        className="underline-hover font-display text-lg tracking-tightest md:text-xl"
                      >
                        {s.film?.title || "Séance"}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink/70">
                        {s.room}
                        {s.versionNote ? ` — ${s.versionNote}` : ""}
                      </p>
                    </div>
                    <span
                      className={`col-span-2 font-display text-xs tracking-widen md:col-span-1 md:text-right ${
                        s.status === "annule" ? "text-red" : "text-ink/60"
                      }`}
                    >
                      {statusText[s.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 overflow-x-auto px-4 py-8 md:grid-cols-7 md:gap-4 md:px-8">
          {days.map((d) => (
            <div key={d.date} className="min-w-[140px] border-t-2 border-ink pt-3">
              <p className="font-display text-sm capitalize tracking-widen">
                {formatDayHeading(d.date)}
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {d.screenings.map((s) => (
                  <li key={s._id}>
                    <Link
                      href={s.film ? `/films/${s.film.slug}` : "/films"}
                      className="underline-hover block font-display text-sm leading-tight tracking-tightest"
                    >
                      {s.time} — {s.film?.title}
                    </Link>
                    <p className="text-[11px] text-ink/65">
                      {s.room}
                      {statusText[s.status] ? ` · ${statusText[s.status]}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 font-display text-xs tracking-widen transition-colors duration-200 ${
        active ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink/70 hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}
