import Image from "next/image";
import Link from "next/link";
import { FilmPoster } from "@/components/poster/FilmPoster";
import zinemaLogo from "@/public/zinema-logo.png";
import type { Film } from "@/lib/types";

interface Slot {
  left: string;
  top: string;
  width: string;
}

// Positions choisies à la main pour un effet dispersé mais équilibré :
// pas de miroir strict, mais une masse à peu près égale de chaque côté.
const desktopSlots: Slot[] = [
  { left: "3%", top: "6%", width: "17%" },
  { left: "23%", top: "20%", width: "14%" },
  { left: "2%", top: "56%", width: "16%" },
  { left: "20%", top: "68%", width: "15%" },
  { left: "66%", top: "3%", width: "15%" },
  { left: "85%", top: "22%", width: "13%" },
  { left: "68%", top: "58%", width: "15%" },
  { left: "86%", top: "66%", width: "13%" },
];

const mobileOffsets = ["mt-0", "mt-10", "mt-4", "mt-16", "mt-2", "mt-12", "mt-6", "mt-0"];

export function PosterCanvas({ films }: { films: Film[] }) {
  const items = films.slice(0, 8);
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <section className="relative bg-paper">
      {/* Mobile : deux colonnes en quinconce, non symétriques */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-10 pt-6 md:hidden">
        <div className="flex flex-col gap-3">
          {left.slice(0, 2).map((film, i) => (
            <CanvasPoster key={film._id} film={film} className={mobileOffsets[i]} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {right.slice(0, 2).map((film, i) => (
            <CanvasPoster key={film._id} film={film} className={mobileOffsets[i + 4]} />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-4 md:hidden">
        <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-[58vw]" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-16 pt-4 md:hidden">
        <div className="flex flex-col gap-3">
          {left.slice(2, 4).map((film, i) => (
            <CanvasPoster key={film._id} film={film} className={mobileOffsets[i + 2]} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {right.slice(2, 4).map((film, i) => (
            <CanvasPoster key={film._id} film={film} className={mobileOffsets[i + 6]} />
          ))}
        </div>
      </div>

      {/* Desktop : canevas dispersé, le logo occupe le vide central */}
      <div className="relative mx-auto hidden md:block" style={{ maxWidth: 1400, height: 1350 }}>
        <div className="pointer-events-none absolute left-1/2 top-[47%] z-0 w-[30%] -translate-x-1/2 -translate-y-1/2">
          <Image src={zinemaLogo} alt="Zinéma" priority className="h-auto w-full" />
        </div>

        {items.map((film, i) => (
          <div
            key={film._id}
            className="absolute z-10"
            style={{ left: desktopSlots[i].left, top: desktopSlots[i].top, width: desktopSlots[i].width }}
          >
            <CanvasPoster film={film} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CanvasPoster({ film, className = "" }: { film: Film; className?: string }) {
  return (
    <Link
      href={`/films/${film.slug}`}
      className={`group relative block aspect-[2/3] w-full overflow-hidden transition-transform duration-300 ease-editorial hover:-translate-y-1 ${className}`}
    >
      <FilmPoster film={film} sizes="(min-width: 768px) 16vw, 45vw" />
      <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-sm text-ink opacity-0 shadow-[0_1px_4px_rgba(16,15,12,0.25)] transition-opacity duration-200 group-hover:opacity-100">
        +
      </span>
    </Link>
  );
}
