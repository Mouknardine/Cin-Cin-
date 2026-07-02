"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import { useFilms } from "@/lib/sanity/useContent";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

// Deux colonnes cadrées aux bords de l'écran, logo fixe au centre — les
// affiches ne passent jamais sur le logo, tout reste dans le cadre.
// Le canevas est dessiné pour une largeur de référence puis mis à l'échelle
// par la largeur d'écran réelle. Deux configurations : desktop (cartes plus
// petites, rythme serré) et mobile (cartes plus grandes, moins nombreuses à
// l'écran pour ne pas surcharger).
interface Slot {
  left: number;
  top: number;
}

interface CanvasConfig {
  designWidth: number;
  posterWidth: number;
  posterHeight: number;
  cycleHeight: number;
  slots: Slot[];
}

// Desktop : colonnes gauche/droite en quinconce, 3 + 3 par cycle.
const desktopConfig: CanvasConfig = {
  designWidth: 1200,
  posterWidth: 230,
  posterHeight: 345,
  cycleHeight: 1290,
  slots: [
    { left: 50, top: 0 },
    { left: 920, top: 215 },
    { left: 50, top: 430 },
    { left: 920, top: 645 },
    { left: 50, top: 860 },
    { left: 920, top: 1075 },
  ],
};

// Mobile : mêmes deux colonnes cadrées bord, cartes proportionnellement plus
// grandes et rythme plus aéré — moins de cartes visibles à la fois.
const mobileConfig: CanvasConfig = {
  designWidth: 400,
  posterWidth: 130,
  posterHeight: 195,
  cycleHeight: 1200,
  slots: [
    { left: 10, top: 0 },
    { left: 260, top: 200 },
    { left: 10, top: 400 },
    { left: 260, top: 600 },
    { left: 10, top: 800 },
    { left: 260, top: 1000 },
  ],
};

// 6 cases par cycle et 8 films : le motif ne redevient identique qu'au bout
// de 4 cycles (ppcm(6,8)/6 = 4). Les sauts de boucle doivent donc être des
// multiples de 4 cycles pour rester invisibles.
const COPIES = 16;
const JUMP = 8;

// Le film attribué à chaque case suit un compteur global qui ne se
// réinitialise jamais d'un cycle à l'autre : la place de chaque film change
// à chaque nouveau passage.
function filmForSlot(films: Film[], copyIndex: number, slotIndex: number) {
  const n = films.length;
  const globalIndex = copyIndex * 6 + slotIndex;
  return films[globalIndex % n];
}

export function PosterCanvas() {
  // Lu directement dans le navigateur à chaque visite : le contenu Sanity
  // publié apparaît sans jamais reconstruire le site.
  const films = useFilms();
  const items = useMemo(() => {
    const active = films
      .filter((f) => f.status !== "passe")
      .sort((a, b) => Number(Boolean(b.featuredHome)) - Number(Boolean(a.featuredHome)));
    return active.slice(0, 8);
  }, [films]);
  const [view, setView] = useState<{ config: CanvasConfig; scale: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledIn = useRef(false);

  useEffect(() => {
    const update = () =>
      setView(() => {
        const config = window.innerWidth < 768 ? mobileConfig : desktopConfig;
        return { config, scale: window.innerWidth / config.designWidth };
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Attaché seulement une fois la zone de défilement rendue (elle n'existe
  // pas au tout premier rendu, avant la mesure de l'écran) — sinon la
  // boucle et le centrage initial ne s'installent jamais.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const cyclePx = () => {
      const config = window.innerWidth < 768 ? mobileConfig : desktopConfig;
      return config.cycleHeight * (window.innerWidth / config.designWidth);
    };

    if (!scrolledIn.current) {
      scrolledIn.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTo({ top: JUMP * cyclePx(), left: 0, behavior: "instant" });
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

    // Deux niveaux de protection pour la boucle : recentrage différé une
    // fois le défilement stabilisé (ne se bat pas avec l'inertie tactile),
    // et garde-fou immédiat près des bords physiques du tampon — le saut
    // étant un multiple exact de la période du motif, il est invisible.
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
      el.removeEventListener("scroll", onScroll);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [view === null]);

  if (!view) {
    // Premier rendu (avant mesure de l'écran) : logo seul, pas de saut visuel.
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-paper">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[26vw] max-w-[320px] md:w-[30vw]" />
      </div>
    );
  }

  const { config, scale } = view;

  const copy = (c: number) => (
    <div
      key={c}
      style={{ position: "absolute", top: c * config.cycleHeight, left: 0, width: config.designWidth, height: config.cycleHeight }}
    >
      {config.slots.map((slot, i) => (
        <div
          key={`${c}-${i}`}
          style={{ position: "absolute", left: slot.left, top: slot.top, width: config.posterWidth, height: config.posterHeight }}
        >
          <CanvasPoster film={filmForSlot(items, c, i)} priority={c === JUMP && i < 3} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-paper">
      {/* Le logo ne bouge jamais et reste toujours entièrement visible :
          les deux colonnes défilent de part et d'autre sans le recouvrir. */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[26vw] max-w-[320px] md:w-[30vw]" />
      </div>

      <div ref={scrollRef} className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
        <div style={{ position: "relative", width: "100%", height: config.cycleHeight * COPIES * scale }}>
          <div
            style={{
              width: config.designWidth,
              height: config.cycleHeight * COPIES,
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
      href={`/film/?s=${film.slug}`}
      className="group relative block h-full w-full overflow-hidden transition-transform duration-300 ease-editorial hover:-translate-y-1"
    >
      <FilmPoster film={film} priority={priority} sizes="(min-width: 768px) 15vw, 33vw" />
      <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-xs text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
