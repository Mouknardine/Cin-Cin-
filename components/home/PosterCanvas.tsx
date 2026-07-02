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

// Trois colonnes, triées de haut en bas. La colonne du milieu (une seule
// affiche par cycle) est centrée sur le logo, donc son affiche passe
// directement par-dessus en défilant. Le cycle est répété à l'infini, mais
// le film assigné à chaque case suit un compteur global (jamais réinitialisé
// à chaque cycle) qui avance de 7 en 7 sur 8 films : comme 7 et 8 sont
// premiers entre eux, la place de chaque film change à chaque passage, et
// n'importe quelle suite de 8 cases consécutives (donc tout ce qui peut être
// visible en même temps à l'écran) contient les 8 films une seule fois —
// jamais deux fois la même affiche visible simultanément.
const slots: Slot[] = [
  { left: 40, top: 40 },
  { left: 880, top: 300 },
  { left: 40, top: 1150 },
  { left: 880, top: 1410 },
  { left: 460, top: 1780 },
  { left: 40, top: 2260 },
  { left: 880, top: 2520 },
];
const SLOTS_PER_CYCLE = slots.length;

// Le plus grand vide de la colonne centrale (une seule affiche par cycle),
// utilisé pour garantir que le logo est entièrement visible à l'arrivée.
const SAFE_GAP_CENTER = 890;

const DESIGN_CYCLE_HEIGHT = 3400;
// 7 cases par cycle et 8 films : le motif ne redevient identique qu'au bout
// de 8 cycles (ppcm(7,8)/7 = 8). Il faut donc sauter d'exactement 8 cycles
// pour que la téléportation de la boucle soit invisible, et en afficher au
// moins deux fois plus pour garder une marge de défilement confortable.
const COPIES = 16;
const JUMP = 8;

function filmForSlot(films: Film[], copyIndex: number, slotIndex: number) {
  const n = films.length;
  const globalIndex = copyIndex * SLOTS_PER_CYCLE + slotIndex;
  return films[globalIndex % n];
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
          const s = window.innerWidth / DESIGN_WIDTH;
          // Cale le centre de l'écran (où se trouve le logo fixe) sur le
          // plus grand vide de la colonne centrale, pour que le logo soit
          // entièrement visible à l'arrivée, quel que soit le format d'écran.
          const viewportHeightDesign = window.innerHeight / s;
          const targetCenterY = JUMP * DESIGN_CYCLE_HEIGHT + SAFE_GAP_CENTER;
          const targetTopDesign = targetCenterY - viewportHeightDesign / 2;
          window.scrollTo({ top: targetTopDesign * s, left: 0, behavior: "instant" });
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

  const copy = (c: number) => (
    <div key={c} style={{ position: "absolute", top: c * DESIGN_CYCLE_HEIGHT, left: 0, width: DESIGN_WIDTH, height: DESIGN_CYCLE_HEIGHT }}>
      {slots.map((slot, i) => (
        <div
          key={`${c}-${i}`}
          style={{ position: "absolute", left: slot.left, top: slot.top, width: POSTER_WIDTH, height: POSTER_HEIGHT }}
        >
          <CanvasPoster film={filmForSlot(items, c, i)} priority={c === JUMP && i < 3} />
        </div>
      ))}
    </div>
  );

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
