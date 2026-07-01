import Link from "next/link";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { filmMetaLine, statusLabel } from "@/components/film/FilmMeta";
import { hasRealImage } from "@/lib/sanity/image";
import type { Film } from "@/lib/types";

export function Hero({ tagline, featuredFilm }: { tagline?: string; featuredFilm?: Film }) {
  return (
    <section className="border-b border-ink/15">
      <div className="flex items-start justify-between px-4 pt-5 font-display text-[10px] tracking-widen text-ink/70 md:px-8 md:pt-6 md:text-xs">
        <span>LAUSANNE — DEPUIS 2001</span>
        <span className="hidden md:inline">SALLE 1 · SALLE 2</span>
        <span>{tagline || "CINÉMA INDÉPENDANT"}</span>
      </div>

      <div className="grid md:grid-cols-12">
        <div
          className={`flex flex-col gap-8 px-4 py-10 md:self-start md:px-8 md:py-14 ${
            featuredFilm ? "md:col-span-7" : "md:col-span-12"
          }`}
        >
          <h1 className="font-display text-[16vw] leading-[0.82] tracking-tightest md:text-[6vw]">
            LE CINÉMA
            <br />
            <span className="stroke-text">D&apos;UN AUTRE</span>
            <br />
            TEMPS.
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

        {featuredFilm && (
          <div className="flex flex-col border-t border-ink/15 md:col-span-5 md:border-l md:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-ink/15 bg-ink px-4 py-2 font-display text-[10px] tracking-widen text-paper md:px-8">
              <span>FILM DU MOMENT</span>
              <span className="text-paper/60">
                {statusLabel(featuredFilm.status)} — {filmMetaLine(featuredFilm)}
              </span>
            </div>
            <Link
              href={`/films/${featuredFilm.slug}`}
              className="group relative block min-h-[380px] flex-1 overflow-hidden bg-ink md:min-h-[540px]"
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-editorial group-hover:scale-[1.03]">
                <FilmPoster film={featuredFilm} priority sizes="(min-width: 768px) 42vw, 100vw" />
              </div>
              {hasRealImage(featuredFilm.poster) && (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/95 via-ink/15 to-transparent p-5 text-paper md:p-8">
                  <p className="font-display text-2xl leading-[0.95] tracking-tightest md:text-4xl">
                    {featuredFilm.title}
                  </p>
                  <p className="mt-1 text-sm text-paper/80">{featuredFilm.director}</p>
                  <span className="mt-3 inline-flex w-fit items-center gap-2 font-display text-xs tracking-widen text-paper underline-hover">
                    Voir le film →
                  </span>
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
