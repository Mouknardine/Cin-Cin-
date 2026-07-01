import Link from "next/link";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { filmMetaLine, statusLabel } from "@/components/film/FilmMeta";
import { hasRealImage } from "@/lib/sanity/image";
import type { Film } from "@/lib/types";

export function Hero({ tagline, films = [] }: { tagline?: string; films?: Film[] }) {
  const [front, back1, back2] = films;

  return (
    <section className="relative border-b border-ink/15">
      <div className="flex items-start justify-between px-4 pt-5 font-display text-[10px] tracking-widen text-ink/70 md:px-8 md:pt-6 md:text-xs">
        <span>LAUSANNE — DEPUIS 2001</span>
        <span className="hidden md:inline">SALLE 1 · SALLE 2</span>
        <span>{tagline || "CINÉMA INDÉPENDANT"}</span>
      </div>

      <div className="grid md:grid-cols-12 md:items-center">
        <div
          className={`flex flex-col gap-8 px-4 py-8 md:px-8 md:py-16 ${
            front ? "md:col-span-7" : "md:col-span-12"
          }`}
        >
          <h1 className="font-display text-[19vw] leading-[0.78] tracking-tightest md:text-[7.4vw] md:leading-[0.8]">
            LE CINÉMA
            <br />
            <span className="stroke-text">D&apos;UN AUTRE</span>
            <br />
            <span className="text-red">TEMPS.</span>
          </h1>

          <div className="flex flex-col gap-6 border-t border-ink/15 pt-6 font-display text-xs tracking-widen text-ink/70 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-sm normal-case tracking-normal text-ink/85">
              Deux salles, une programmation en VO, et la conviction qu&apos;un
              cinéma de quartier peut rester avant-gardiste.
            </p>
            <div className="flex gap-6">
              <Link href="/films" className="underline-hover">
                Voir les films →
              </Link>
              <Link href="/agenda" className="underline-hover">
                Consulter l&apos;agenda →
              </Link>
            </div>
          </div>
        </div>

        {front && (
          <div className="md:col-span-5">
            {/* Mobile : affiche unique plein cadre, immersive */}
            <div className="md:hidden">
              <FeaturedBar film={front} />
              <Link
                href={`/films/${front.slug}`}
                className="group relative block aspect-[3/4] w-full overflow-hidden bg-ink"
              >
                <div className="absolute inset-0 transition-transform duration-700 ease-editorial group-active:scale-[1.02]">
                  <FilmPoster film={front} priority sizes="100vw" />
                </div>
                {hasRealImage(front.poster) && (
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/95 via-ink/10 to-transparent p-5 text-paper">
                    <p className="font-display text-2xl leading-[0.95] tracking-tightest">
                      {front.title}
                    </p>
                    <p className="mt-1 text-sm text-paper/80">{front.director}</p>
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop : collage d'affiches superposées */}
            <div className="relative hidden h-[30rem] px-4 md:block lg:h-[34rem] xl:h-[38rem]">
              {back2 && (
                <PosterCard
                  film={back2}
                  className="absolute bottom-0 right-2 z-0 w-[54%] rotate-[6deg]"
                />
              )}
              {back1 && (
                <PosterCard
                  film={back1}
                  className="absolute left-0 top-0 z-[1] w-[52%] -rotate-[9deg]"
                />
              )}
              <PosterCard
                film={front}
                className="absolute left-1/2 top-1/2 z-[2] w-[58%] -translate-x-1/2 -translate-y-1/2 -rotate-[3deg]"
                showBar
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedBar({ film }: { film: Film }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-ink/15 bg-ink px-4 py-2 font-display text-[10px] tracking-widen text-paper">
      <span>FILM DU MOMENT</span>
      <span className="text-paper/60">
        {statusLabel(film.status)} — {filmMetaLine(film)}
      </span>
    </div>
  );
}

function PosterCard({
  film,
  className = "",
  showBar = false,
}: {
  film: Film;
  className?: string;
  showBar?: boolean;
}) {
  return (
    <Link
      href={`/films/${film.slug}`}
      className={`group block aspect-[2/3] transition-transform duration-300 ease-editorial hover:-translate-y-1 hover:rotate-0 ${className}`}
    >
      {showBar && (
        <span className="absolute -top-8 left-0 z-10 whitespace-nowrap bg-ink px-2 py-1 font-display text-[10px] tracking-widen text-paper">
          FILM DU MOMENT
        </span>
      )}
      <div className="h-full w-full overflow-hidden border-2 border-ink bg-ink shadow-[10px_10px_0_0_#100F0C]">
        <FilmPoster film={film} priority sizes="30vw" />
      </div>
    </Link>
  );
}
