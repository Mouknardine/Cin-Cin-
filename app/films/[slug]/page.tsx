import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { FilmMeta, filmMetaLine, statusLabel } from "@/components/film/FilmMeta";
import { TrailerEmbed } from "@/components/film/TrailerEmbed";
import { ReviewQuote } from "@/components/film/ReviewQuote";
import { ScreeningsForFilm } from "@/components/film/ScreeningsForFilm";
import { BuyButton } from "@/components/commerce/BuyButton";
import { getFilmBySlug, getFilms } from "@/lib/content";

export async function generateStaticParams() {
  const films = await getFilms();
  return films.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const film = await getFilmBySlug(params.slug);
  if (!film) return {};
  return {
    title: `${film.title} — Zinéma`,
    description: film.synopsis,
  };
}

export default async function FilmDetailPage({ params }: { params: { slug: string } }) {
  const film = await getFilmBySlug(params.slug);
  if (!film) notFound();

  const nextAvailable = film.screenings?.find((s) => s.status === "disponible");

  return (
    <article className="grid gap-8 px-4 py-8 md:grid-cols-12 md:gap-10 md:px-8 md:py-12">
      <div className="md:sticky md:top-24 md:col-span-5 md:h-fit lg:col-span-4">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink">
          <FilmPoster film={film} priority sizes="(min-width: 1080px) 33vw, 100vw" />
        </div>
        {nextAvailable && (
          <div className="mt-4 flex items-center justify-between border border-ink/15 px-4 py-3">
            <div>
              <p className="font-display text-[10px] tracking-widen text-ink/50">
                PROCHAINE SÉANCE
              </p>
              <p className="font-display text-lg tracking-tightest">
                {nextAvailable.time} — {nextAvailable.room}
              </p>
            </div>
            <BuyButton
              checkoutUrl={nextAvailable.sumupCheckoutUrl || film.sumupCheckoutUrl}
              price={nextAvailable.price || film.price}
              label="Billet"
            />
          </div>
        )}
      </div>

      <div className="md:col-span-7 lg:col-span-8">
        <p className="font-display text-xs tracking-widen text-red">{statusLabel(film.status)}</p>
        <h1 className="mt-2 font-display text-[11vw] leading-[0.86] tracking-tightest md:text-[4.6vw]">
          {film.title}
        </h1>
        {film.originalTitle && film.originalTitle !== film.title && (
          <p className="mt-1 text-sm italic text-ink/50">{film.originalTitle}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-ink/15 py-4 font-display text-xs tracking-widen text-ink/70">
          <span>{film.director}</span>
          <span>{filmMetaLine(film)}</span>
        </div>

        {film.genres && film.genres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {film.genres.map((g) => (
              <span key={g} className="border border-ink/20 px-2 py-1 text-[11px] tracking-wide text-ink/60">
                {g}
              </span>
            ))}
          </div>
        )}

        {film.synopsis && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/85 md:text-lg">
            {film.synopsis}
          </p>
        )}

        <section className="mt-10">
          <p className="font-display text-xs tracking-widen text-ink/50">SÉANCES</p>
          <ScreeningsForFilm film={film} />
        </section>

        <section className="mt-10">
          <p className="mb-3 font-display text-xs tracking-widen text-ink/50">BANDE-ANNONCE</p>
          <TrailerEmbed url={film.trailerUrl} title={film.title} />
        </section>

        {film.review && (
          <section className="mt-10">
            <ReviewQuote review={film.review} />
          </section>
        )}
      </div>
    </article>
  );
}
