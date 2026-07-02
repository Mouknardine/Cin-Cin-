"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

// Grille dense (aucun trou), strictement identique sur mobile et desktop.
// Quatre variantes tournent la place de chaque affiche, mises bout à bout
// pour former un seul "méga-bloc" ; ce méga-bloc est répété trois fois pour
// permettre un défilement en boucle sans fin, sans jamais montrer deux fois
// la même disposition d'affilée.
const COLS = 4;
const ROWS = 5;
const VARIANTS = 4;

function tilesForVariant(films: Film[], variantIndex: number) {
  const n = films.length;
  const rotation = (variantIndex * 3) % n;
  return Array.from({ length: COLS * ROWS }, (_, i) => films[(i + rotation) % n]);
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
        <div key={v} className="grid grid-cols-4 gap-2 p-2">
          {tilesForVariant(items, v).map((film, i) => (
            <CanvasPoster key={`${v}-${i}-${film._id}`} film={film} priority={v === 0 && i < 4} />
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="relative bg-paper">
      {/* Le logo ne bouge jamais : les affiches défilent librement par-dessus. */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[42vw] max-w-[380px]" />
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
      <FilmPoster film={film} priority={priority} sizes="25vw" />
      <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-xs text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
