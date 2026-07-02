import Link from "next/link";
import { FilmPoster } from "@/components/poster/FilmPoster";
import type { Film } from "@/lib/types";

// Rangée du haut décalée vers le haut, rangée du bas vers le bas : les deux
// rangées s'écartent du centre au lieu de converger l'une vers l'autre.
const topSlots = [
  { col: "md:col-start-1", y: "md:-translate-y-10" },
  { col: "md:col-start-2", y: "md:-translate-y-4" },
  { col: "md:col-start-4", y: "md:-translate-y-4" },
  { col: "md:col-start-5", y: "md:-translate-y-10" },
];

const bottomSlots = [
  { col: "md:col-start-1", y: "md:translate-y-10" },
  { col: "md:col-start-2", y: "md:translate-y-4" },
  { col: "md:col-start-4", y: "md:translate-y-4" },
  { col: "md:col-start-5", y: "md:translate-y-10" },
];

export function Hero({ tagline, films = [] }: { tagline?: string; films?: Film[] }) {
  const top = films.slice(0, 4);
  const bottom = films.slice(4, 8);

  return (
    <section className="relative border-b border-ink/15 bg-paper">
      <div className="flex items-start justify-between px-4 pt-5 font-display text-[10px] tracking-widen text-ink/70 md:px-8 md:pt-6 md:text-xs">
        <span>LAUSANNE — DEPUIS 2001</span>
        <span className="hidden md:inline">SALLE 1 · SALLE 2</span>
        <span>{tagline || "CINÉMA INDÉPENDANT"}</span>
      </div>

      {/* Mobile : deux blocs d'affiches encadrant le nom, empilés et symétriques */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3 px-4 pt-8">
          {top.map((film) => (
            <MosaicPoster key={film._id} film={film} />
          ))}
        </div>
        <h1 className="px-4 py-8 text-center font-display text-[15vw] leading-[0.82] tracking-tightest">
          ZINÉMA
        </h1>
        <div className="grid grid-cols-2 gap-3 px-4 pb-2">
          {bottom.map((film) => (
            <MosaicPoster key={film._id} film={film} />
          ))}
        </div>
      </div>

      {/* Desktop : mosaïque symétrique, le nom occupe la colonne centrale libre */}
      <div className="relative mx-auto hidden max-w-6xl px-8 py-16 md:block lg:py-20">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <h1 className="font-display text-[6vw] leading-[0.82] tracking-tightest text-ink lg:text-[5.2vw]">
            ZINÉMA
          </h1>
        </div>

        <div className="relative z-10 grid grid-cols-[1fr_1.05fr_1.4fr_1.05fr_1fr] gap-6 lg:gap-8">
          {top.map((film, i) => (
            <MosaicPoster
              key={film._id}
              film={film}
              className={`${topSlots[i].col} md:row-start-1 ${topSlots[i].y}`}
            />
          ))}
          {bottom.map((film, i) => (
            <MosaicPoster
              key={film._id}
              film={film}
              className={`${bottomSlots[i].col} md:row-start-2 ${bottomSlots[i].y}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-ink/15 px-4 py-6 text-center md:px-8">
        <p className="max-w-md text-sm text-ink/85">
          Deux salles, une programmation en VO, et la conviction qu&apos;un
          cinéma de quartier peut rester avant-gardiste.
        </p>
        <div className="flex gap-6 font-display text-xs tracking-widen text-ink/70">
          <Link href="/films" className="underline-hover">
            Voir les films →
          </Link>
          <Link href="/agenda" className="underline-hover">
            Consulter l&apos;agenda →
          </Link>
        </div>
      </div>
    </section>
  );
}

function MosaicPoster({ film, className = "" }: { film: Film; className?: string }) {
  return (
    <Link
      href={`/films/${film.slug}`}
      className={`group relative block aspect-[2/3] w-full overflow-hidden transition-transform duration-300 ease-editorial hover:-translate-y-1 ${className}`}
    >
      <FilmPoster film={film} sizes="(min-width: 768px) 20vw, 45vw" />
      <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-sm text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
