"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

// Le canevas est dessiné une fois pour une largeur de référence fixe
// (DESIGN_WIDTH, en pixels), puis mis à l'échelle en bloc avec un
// `transform: scale()` pour occuper toute la largeur d'écran — mobile et
// desktop affichent donc rigoureusement le même visuel, juste agrandi ou
// réduit, jamais deux dispositions différentes.
const DESIGN_WIDTH = 1200;
const POSTER_WIDTH = 280;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

interface Slot {
  left: number;
  top: number;
}

// Trois colonnes : la colonne du milieu est centrée sur le logo, donc ses
// affiches passent directement par-dessus en défilant.
const columns: { left: number; tops: number[] }[] = [
  { left: 40, tops: [20, 610, 1200, 1790] },
  { left: 460, tops: [300, 890, 1480, 2070] },
  { left: 880, tops: [150, 740, 1330, 1920] },
];

const slots: Slot[] = columns.flatMap((col) => col.tops.map((top) => ({ left: col.left, top })));

const DESIGN_CYCLE_HEIGHT = 2550;
const VARIANTS = 3;
// Répété 6 fois (2 tours complets des 3 variantes) pour laisser une large
// marge de défilement avant chaque téléportation invisible — sur un écran
// étroit, une seule variante de battement ne laissait presque aucune marge.
const COPIES = 6;
const JUMP = 3;

function filmForSlot(films: Film[], slotIndex: number, variantIndex: number) {
  const n = films.length;
  const rotation = (variantIndex * 3) % n;
  return films[(slotIndex + rotation) % n];
}

export function PosterCanvas({ films }: { films: Film[] }) {
  const items = films.slice(0, 8);
  const [scale, setScale] = useState(1);
  const scrolledIn = useRef(false);

  useEffect(() => {
    const updateScale = () => setScale(window.innerWidth / DESIGN_WIDTH);
    updateScale();
    window.addEventListener("resize", updateScale);

    const cyclePx = () => DESIGN_CYCLE_HEIGHT * (window.innerWidth / DESIGN_WIDTH);

    if (!scrolledIn.current) {
      scrolledIn.current = true;
      // Repoussé après la peinture et après la restauration de scroll de
      // Next.js, qui peut sinon écraser ce saut initial.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: JUMP * cyclePx() + 1, left: 0, behavior: "instant" });
        });
      });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const c = cyclePx();
        const y = window.scrollY;
        if (y < c * (JUMP - 1.5)) {
          window.scrollTo({ top: y + JUMP * c, left: 0, behavior: "instant" });
        } else if (y > c * (JUMP + 1.5)) {
          window.scrollTo({ top: y - JUMP * c, left: 0, behavior: "instant" });
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const copy = (c: number) => {
    const v = c % VARIANTS;
    return (
      <div key={c} style={{ position: "absolute", top: c * DESIGN_CYCLE_HEIGHT, left: 0, width: DESIGN_WIDTH, height: DESIGN_CYCLE_HEIGHT }}>
        {slots.map((slot, i) => (
          <div
            key={`${c}-${i}`}
            style={{ position: "absolute", left: slot.left, top: slot.top, width: POSTER_WIDTH, height: POSTER_HEIGHT }}
          >
            <CanvasPoster film={filmForSlot(items, i, v)} priority={c === JUMP && i < 3} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden bg-paper" style={{ height: DESIGN_CYCLE_HEIGHT * COPIES * scale }}>
      {/* Le logo ne bouge jamais : les affiches défilent librement par-dessus. */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[34vw] max-w-[320px]" />
      </div>

      <div
        className="absolute left-0 top-0 z-10"
        style={{ width: DESIGN_WIDTH, height: DESIGN_CYCLE_HEIGHT * COPIES, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {Array.from({ length: COPIES }, (_, c) => copy(c))}
      </div>
    </div>
  );
}

function CanvasPoster({ film, priority = false }: { film: Film; priority?: boolean }) {
  return (
    <Link
      href={`/films/${film.slug}`}
      className="group relative block h-full w-full overflow-hidden transition-transform duration-300 ease-editorial hover:-translate-y-1"
    >
      <FilmPoster film={film} priority={priority} sizes="280px" />
      <span className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-paper text-sm text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
