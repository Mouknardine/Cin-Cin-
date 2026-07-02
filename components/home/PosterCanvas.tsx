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

// Disposition originale à 3 colonnes de 4 affiches : la colonne du milieu
// est centrée sur le logo, donc ses affiches passent directement par-dessus
// en défilant. Triée de haut en bas pour que l'attribution des films
// ci-dessous suive l'ordre visuel réel à l'écran.
const slots: Slot[] = [
  { left: 40, top: 20 },
  { left: 880, top: 150 },
  { left: 460, top: 300 },
  { left: 40, top: 610 },
  { left: 880, top: 740 },
  { left: 460, top: 890 },
  { left: 40, top: 1200 },
  { left: 880, top: 1330 },
  { left: 460, top: 1480 },
  { left: 40, top: 1790 },
  { left: 880, top: 1920 },
  { left: 460, top: 2070 },
];
const SLOTS_PER_CYCLE = slots.length;

// Le film attribué à chaque case suit un compteur global qui ne se
// réinitialise jamais d'un cycle à l'autre (pas de rotation par variante) :
// deux cases ne peuvent porter le même film que si elles sont à au moins 8
// positions d'écart dans l'ordre visuel, et la place de chaque film change
// à chaque nouveau passage. Avec cette disposition dense et seulement 8
// films, un écran mobile très haut peut malgré tout montrer plus de 8 cases
// à la fois — dans ce cas rare, deux affiches identiques peuvent apparaître
// en même temps ; cela disparaîtra de lui-même une fois de vraies affiches
// (photos) mises en ligne, qui ne posent plus cette limite.
function filmForSlot(films: Film[], copyIndex: number, slotIndex: number) {
  const n = films.length;
  const globalIndex = copyIndex * SLOTS_PER_CYCLE + slotIndex;
  return films[globalIndex % n];
}

// Le plus grand vide de la colonne centrale, utilisé pour garantir que le
// logo est entièrement visible à l'arrivée sur le site.
const SAFE_GAP_CENTER = 150;

const DESIGN_CYCLE_HEIGHT = 2550;
// 12 cases par cycle et 8 films : le motif redevient identique tous les 2
// cycles (ppcm(12,8)/12 = 2). Sauter d'exactement 2 cycles rend donc la
// téléportation de la boucle invisible.
const COPIES = 6;
const JUMP = 2;

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

    // La correction n'est appliquée qu'une fois le défilement stabilisé
    // (et jamais pendant le geste), pour ne pas se battre avec l'inertie
    // tactile sur mobile — c'est ce qui provoquait les à-coups.
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const c = cyclePx();
        const y = window.scrollY;
        if (y < c * (JUMP - 1.5)) {
          window.scrollTo({ top: y + JUMP * c, left: 0, behavior: "instant" });
        } else if (y > c * (JUMP + 1.5)) {
          window.scrollTo({ top: y - JUMP * c, left: 0, behavior: "instant" });
        }
      }, 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScale);
      if (settleTimer) clearTimeout(settleTimer);
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
