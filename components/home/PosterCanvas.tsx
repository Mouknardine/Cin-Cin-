"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

// Tout est exprimé en vw (y compris les positions verticales) : la
// disposition est donc une pure fonction de la largeur d'écran, strictement
// identique sur mobile et desktop — jamais deux compositions différentes.
// Quatre colonnes de largeur égale, comme sur gregorcollienne.com, avec un
// grand vide central pour le logo et de larges espaces entre les affiches —
// pas de grille serrée. Toutes les affiches ont la même taille.
interface Slot {
  left: number;
  width: number;
  top: number;
}

const POSTER_WIDTH = 14;

const columns: { left: number; tops: number[] }[] = [
  { left: 3, tops: [1, 31, 61, 91] },
  { left: 20, tops: [12, 42, 72, 102] },
  { left: 66, tops: [6, 36, 66, 96] },
  { left: 83, tops: [18, 48, 78, 108] },
];

const slots: Slot[] = columns.flatMap((col) =>
  col.tops.map((top) => ({ left: col.left, width: POSTER_WIDTH, top }))
);

const CYCLE_VW = 132;
const VARIANTS = 3;

function filmForSlot(films: Film[], slotIndex: number, variantIndex: number) {
  const n = films.length;
  const rotation = (variantIndex * 3) % n;
  return films[(slotIndex + rotation) % n];
}

export function PosterCanvas({ films }: { films: Film[] }) {
  const items = films.slice(0, 8);
  const megaRef = useRef<HTMLDivElement>(null);
  const megaHeight = useRef(0);
  const scrolledIn = useRef(false);

  useEffect(() => {
    const measure = () => {
      if (megaRef.current) megaHeight.current = megaRef.current.offsetHeight;
    };
    measure();
    window.addEventListener("resize", measure);

    if (!scrolledIn.current) {
      scrolledIn.current = true;
      // Repoussé après la peinture et après la restauration de scroll de
      // Next.js, qui peut sinon écraser ce saut initial.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measure();
          window.scrollTo({ top: megaHeight.current + 1, left: 0, behavior: "instant" });
        });
      });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = megaHeight.current;
        const y = window.scrollY;
        if (h > 0) {
          if (y < h * 0.05) {
            window.scrollTo({ top: y + h, left: 0, behavior: "instant" });
          } else if (y > h * 1.95) {
            window.scrollTo({ top: y - h, left: 0, behavior: "instant" });
          }
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const megaBlock = (
    <>
      {Array.from({ length: VARIANTS }, (_, v) => (
        <div key={v} className="relative" style={{ height: `${CYCLE_VW}vw` }}>
          {slots.map((slot, i) => (
            <div
              key={`${v}-${i}`}
              className="absolute"
              style={{ left: `${slot.left}vw`, top: `${slot.top}vw`, width: `${slot.width}vw` }}
            >
              <CanvasPoster film={filmForSlot(items, i, v)} priority={v === 0 && i < 4} />
            </div>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="relative bg-paper">
      {/* Le logo ne bouge jamais : les affiches défilent librement par-dessus. */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[34vw] max-w-[320px]" />
      </div>

      <div className="relative z-10">
        <div ref={megaRef}>{megaBlock}</div>
        {megaBlock}
        {megaBlock}
      </div>
    </div>
  );
}

function CanvasPoster({ film, priority = false }: { film: Film; priority?: boolean }) {
  return (
    <Link
      href={`/films/${film.slug}`}
      className="group relative block aspect-[2/3] w-full overflow-hidden transition-transform duration-300 ease-editorial hover:-translate-y-1"
    >
      <FilmPoster film={film} priority={priority} sizes="14vw" />
      <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-xs text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
