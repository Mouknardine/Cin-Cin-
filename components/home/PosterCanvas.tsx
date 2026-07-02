"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FilmPoster } from "@/components/poster/FilmPoster";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

interface Slot {
  left: string;
  top: string;
  width: string;
}

// Une seule disposition (en vw / vh), strictement identique sur mobile et
// desktop : seule l'échelle change avec la largeur d'écran, jamais l'agencement.
const CYCLE_VH = 240;

const slots: Slot[] = [
  { left: "4vw", top: "4vh", width: "clamp(90px, 15vw, 260px)" },
  { left: "28vw", top: "30vh", width: "clamp(80px, 12vw, 210px)" },
  { left: "62vw", top: "10vh", width: "clamp(90px, 14vw, 240px)" },
  { left: "78vw", top: "38vh", width: "clamp(80px, 12vw, 210px)" },
  { left: "6vw", top: "72vh", width: "clamp(85px, 13vw, 225px)" },
  { left: "27vw", top: "98vh", width: "clamp(90px, 15vw, 260px)" },
  { left: "63vw", top: "80vh", width: "clamp(90px, 14vw, 240px)" },
  { left: "79vw", top: "104vh", width: "clamp(80px, 12vw, 210px)" },
];

export function PosterCanvas({ films }: { films: Film[] }) {
  const items = films.slice(0, 8);
  const scrolledIn = useRef(false);

  useEffect(() => {
    const cyclePx = () => (CYCLE_VH / 100) * window.innerHeight;

    if (!scrolledIn.current) {
      scrolledIn.current = true;
      // Repoussé après la peinture et après la restauration de scroll de
      // Next.js, qui peut sinon écraser ce saut initial.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: cyclePx() + 1, left: 0, behavior: "instant" });
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
        if (y < c * 0.05) {
          window.scrollTo({ top: y + c, left: 0, behavior: "instant" });
        } else if (y > c * 1.95) {
          window.scrollTo({ top: y - c, left: 0, behavior: "instant" });
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative bg-paper">
      {/* Le logo ne bouge jamais : les affiches défilent par-dessus. */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[42vw] max-w-[380px]" />
      </div>

      <div className="relative z-10" style={{ height: `${CYCLE_VH * 3}vh` }}>
        {[0, 1, 2].map((cycle) => (
          <div
            key={cycle}
            className="absolute inset-x-0"
            style={{ top: `${cycle * CYCLE_VH}vh`, height: `${CYCLE_VH}vh` }}
          >
            {items.map((film, i) => (
              <div key={film._id} className="absolute" style={{ left: slots[i].left, top: slots[i].top, width: slots[i].width }}>
                <CanvasPoster film={film} priority={cycle === 1} />
              </div>
            ))}
          </div>
        ))}
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
      <FilmPoster film={film} priority={priority} sizes="(min-width: 768px) 16vw, 30vw" />
      <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-sm text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
