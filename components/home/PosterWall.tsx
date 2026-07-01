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
  const items = films.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-12 md:gap-5 md:px-8">
      {items.map((film, i) => (
        <Reveal
          key={film._id}
          delay={i * 0.08}
          className={`group relative col-span-2 aspect-[2/3] ${spanByPosition[i % spanByPosition.length]}`}
        >
          <Link href={`/films/${film.slug}`} className="relative block h-full w-full overflow-hidden bg-ink">
            <div className="absolute inset-0 transition-transform duration-700 ease-editorial group-hover:scale-[1.04]">
              <FilmPoster film={film} priority={i === 0} />
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
        </Reveal>
      ))}
    </div>
  );
}
