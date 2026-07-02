"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

// Le canevas est dessiné une fois pour une largeur de référence fixe
// (DESIGN_WIDTH, en pixels) puis mis à l'échelle par la largeur d'écran :
// mobile et desktop affichent rigoureusement la même composition (mêmes
// positions, mêmes proportions, même espacement), juste plus petite sur un
// écran étroit. Aucun étirement, aucun cadre, aucune variante.
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
// réinitialise jamais d'un cycle à l'autre : la place de chaque film change
// à chaque nouveau passage, sans jamais répéter le même arrangement deux
// cycles de suite.
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
// cycles (ppcm(12,8)/12 = 2), donc tout saut d'un multiple de 2 cycles est
// invisible. Sur mobile, un cycle ne fait que ~830px réels : un seul geste
// d'inertie peut traverser plusieurs cycles avant que la correction différée
// ne se déclenche. D'où un tampon large (16 copies, recentrage à 8) et un
// garde-fou immédiat près des bords physiques.
const COPIES = 16;
const JUMP = 8;

export function PosterCanvas({ films }: { films: Film[] }) {
  const items = films.slice(0, 8);
  const [scale, setScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledIn = useRef(false);

  useEffect(() => {
    const computeScale = () => window.innerWidth / DESIGN_WIDTH;
    const updateScale = () => setScale(computeScale());
    updateScale();
    window.addEventListener("resize", updateScale);

    const cyclePx = () => DESIGN_CYCLE_HEIGHT * computeScale();
    const el = scrollRef.current;
    if (!el) return;

    if (!scrolledIn.current) {
      scrolledIn.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const s = computeScale();
          // Cale le centre de l'écran (où se trouve le logo fixe) sur le
          // plus grand vide de la colonne centrale, pour que le logo soit
          // entièrement visible à l'arrivée, quel que soit le format d'écran.
          const viewportHeightDesign = window.innerHeight / s;
          const targetCenterY = JUMP * DESIGN_CYCLE_HEIGHT + SAFE_GAP_CENTER;
          const targetTopDesign = targetCenterY - viewportHeightDesign / 2;
          el.scrollTo({ top: targetTopDesign * s, left: 0, behavior: "instant" });
        });
      });
    }

    const recentre = () => {
      const c = cyclePx();
      const y = el.scrollTop;
      if (y < c * (JUMP - 4)) {
        el.scrollTo({ top: y + JUMP * c, left: 0, behavior: "instant" });
      } else if (y > c * (JUMP + 4)) {
        el.scrollTo({ top: y - JUMP * c, left: 0, behavior: "instant" });
      }
    };

    // Deux niveaux de protection pour la boucle :
    // 1. Recentrage différé une fois le défilement stabilisé (doux, ne se
    //    bat jamais avec l'inertie tactile).
    // 2. Garde-fou immédiat si on s'approche des bords physiques du tampon
    //    (un geste très fort peut traverser plusieurs cycles d'un coup) —
    //    le saut étant un multiple exact de la période, il est invisible.
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let ticking = false;
    const onScroll = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(recentre, 120);

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const c = cyclePx();
        const y = el.scrollTop;
        const max = el.scrollHeight - el.clientHeight;
        if (y < c * 2 || y > max - c * 2) recentre();
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", updateScale);
      el.removeEventListener("scroll", onScroll);
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
    <div className="fixed inset-0 z-0 overflow-hidden bg-paper">
      {/* Le logo ne bouge jamais : les affiches défilent librement par-dessus. */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[34vw] max-w-[320px]" />
      </div>

      <div ref={scrollRef} className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
        <div style={{ position: "relative", width: "100%", height: DESIGN_CYCLE_HEIGHT * COPIES * scale }}>
          <div
            style={{
              width: DESIGN_WIDTH,
              height: DESIGN_CYCLE_HEIGHT * COPIES,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {Array.from({ length: COPIES }, (_, c) => copy(c))}
          </div>
        </div>
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
