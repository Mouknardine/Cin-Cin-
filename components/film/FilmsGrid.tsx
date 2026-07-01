"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { Reveal } from "@/components/motion/Reveal";
import { FilmMeta, statusLabel } from "@/components/film/FilmMeta";
import { hasRealImage } from "@/lib/sanity/image";
import type { Film, FilmStatus } from "@/lib/types";

const spanBySize: Record<Film["posterSize"], string> = {
  large: "md:col-span-6 md:row-span-2",
  medium: "md:col-span-4",
  small: "md:col-span-3",
};

const offsetPattern = ["", "md:mt-10", "", "md:mt-16", "md:mt-6", ""];

export function FilmsGrid({ films }: { films: Film[] }) {
  const [filter, setFilter] = useState<FilmStatus | "tous">("tous");

  const statuses = useMemo(() => {
    const set = new Set(films.map((f) => f.status));
    return Array.from(set);
  }, [films]);

  const visible = filter === "tous" ? films : films.filter((f) => f.status === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 px-4 pb-8 md:px-8">
        <FilterChip active={filter === "tous"} onClick={() => setFilter("tous")}>
          Tous
        </FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {statusLabel(s)}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-10 px-4 md:grid-cols-12 md:gap-x-5 md:gap-y-16 md:px-8">
        {visible.map((film, i) => (
          <Reveal
            key={film._id}
            delay={(i % 6) * 0.06}
            className={`col-span-2 ${spanBySize[film.posterSize]} ${offsetPattern[i % offsetPattern.length]}`}
          >
            <Link href={`/films/${film.slug}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden bg-ink">
                <div className="absolute inset-0 transition-transform duration-700 ease-editorial group-hover:scale-[1.04]">
                  <FilmPoster film={film} />
                </div>
                {hasRealImage(film.poster) && (
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-paper/70 bg-ink/40 text-paper backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    →
                  </span>
                )}
              </div>
              <FilmMeta film={film} className="mt-3" />
            </Link>
          </Reveal>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="px-4 py-16 text-center font-display text-sm tracking-widen text-ink/60 md:px-8">
          Aucun film dans cette catégorie pour le moment.
        </p>
      )}
    </div>
  );
}

function FilterChip({
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
