import Link from "next/link";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { Reveal } from "@/components/motion/Reveal";
import { hasRealImage } from "@/lib/sanity/image";
import type { Film } from "@/lib/types";

const spanByPosition = [
  "md:col-span-4 md:row-span-2 aspect-[3/4]",
  "md:col-span-3 md:row-span-2 aspect-[2/3] md:mt-16",
  "md:col-span-3 md:row-span-2 aspect-[2/3]",
  "md:col-span-2 md:row-span-1 aspect-[3/4] md:mt-8",
];

export function PosterWall({ films }: { films: Film[] }) {
  const deskItems = films.slice(0, 4);
  const mobileItems = films.slice(0, 6);

  return (
    <>
      {/* Mobile : mur d'affiches en carrousel horizontal, plus tactile qu'une grille empilée */}
      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden">
        {mobileItems.map((film, i) => (
          <Reveal
            key={film._id}
            delay={i * 0.06}
            className="w-[68vw] shrink-0 snap-center first:ml-0 last:mr-4"
          >
            <PosterCard film={film} priority={i === 0} />
          </Reveal>
        ))}
      </div>

      {/* Desktop : grille asymétrique */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-5 md:px-8">
        {deskItems.map((film, i) => (
          <Reveal
            key={film._id}
            delay={i * 0.08}
            className={`group relative aspect-[2/3] ${spanByPosition[i % spanByPosition.length]}`}
          >
            <PosterCard film={film} priority={i === 0} />
          </Reveal>
        ))}
      </div>
    </>
  );
}

function PosterCard({ film, priority = false }: { film: Film; priority?: boolean }) {
  return (
    <Link
      href={`/films/${film.slug}`}
      className="group relative block aspect-[2/3] h-full w-full overflow-hidden border-2 border-ink bg-ink shadow-[8px_8px_0_0_#100F0C] transition-shadow duration-300 ease-editorial hover:shadow-[4px_4px_0_0_#100F0C]"
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-editorial group-hover:scale-[1.04]">
        <FilmPoster film={film} priority={priority} />
      </div>
      {hasRealImage(film.poster) && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/10 to-transparent p-4 md:p-5">
          <p className="font-display text-lg tracking-tightest text-paper md:text-2xl">
            {film.title}
          </p>
          <p className="mt-1 font-display text-[11px] tracking-widen text-paper/75">
            {film.director} {film.year ? `— ${film.year}` : ""}
          </p>
        </div>
      )}
      {hasRealImage(film.poster) && (
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-paper/70 bg-ink/40 text-paper backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 md:right-4 md:top-4">
          →
        </span>
      )}
    </Link>
  );
}
