"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { filmMetaLine, statusLabel } from "@/components/film/FilmMeta";
import { TrailerEmbed } from "@/components/film/TrailerEmbed";
import { ReviewQuote } from "@/components/film/ReviewQuote";
import { ScreeningsForFilm } from "@/components/film/ScreeningsForFilm";
import { BuyButton } from "@/components/commerce/BuyButton";
import { useFilmBySlug } from "@/lib/sanity/useContent";

// Le site étant un export statique (aucun serveur), il ne peut pas générer
// une page par film à l'avance sans reconstruire à chaque ajout dans
// Sanity. La fiche film utilise donc une seule page réelle (/film/) qui lit
// le film demandé dans l'URL (?s=le-slug) et va le chercher dans le
// navigateur — un nouveau film publié dans Sanity a immédiatement une
// fiche fonctionnelle, sans jamais reconstruire le site.
export function FilmDetail() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    setSlug(new URLSearchParams(window.location.search).get("s") || "");
  }, []);

  const film = useFilmBySlug(slug || "");

  useEffect(() => {
    if (film) document.title = `${film.title} — Zinéma`;
  }, [film]);

  if (slug === null) return null;

  if (!film) {
    return (
      <div className="px-4 py-16 text-center md:px-8">
        <p className="font-display text-xs tracking-widen text-ink/70">FILM INTROUVABLE</p>
        <p className="mt-3 font-display text-2xl tracking-tightest md:text-3xl">
          Ce film n&apos;existe pas ou plus.
        </p>
        <Link href="/films/" className="underline-hover mt-5 inline-block font-display text-sm tracking-widen">
          ← Retour aux films
        </Link>
      </div>
    );
  }

  const nextAvailable = film.screenings?.find((s) => s.status === "disponible");

  return (
    <article className="grid gap-8 px-4 py-8 md:grid-cols-12 md:gap-10 md:px-8 md:py-12">
      <div className="md:sticky md:top-24 md:col-span-5 md:h-fit lg:col-span-4">
        <div className="relative aspect-[2/3] w-full overflow-hidden border-2 border-ink bg-ink shadow-[10px_10px_0_0_#100F0C]">
          <FilmPoster film={film} priority sizes="(min-width: 1080px) 33vw, 100vw" />
        </div>
        {nextAvailable && (
          <div className="mt-4 flex items-center justify-between border border-ink/15 px-4 py-3">
            <div>
              <p className="font-display text-[10px] tracking-widen text-ink/70">
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
          <p className="mt-1 text-sm italic text-ink/65">{film.originalTitle}</p>
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
          <p className="font-display text-xs tracking-widen text-ink/70">SÉANCES</p>
          <ScreeningsForFilm film={film} />
        </section>

        <section className="mt-10">
          <p className="mb-3 font-display text-xs tracking-widen text-ink/70">BANDE-ANNONCE</p>
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
