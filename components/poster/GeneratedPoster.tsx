import { hashString } from "@/lib/hash";

interface GeneratedPosterProps {
  title: string;
  director?: string;
  year?: number;
  seed: string;
  className?: string;
}

/**
 * Affiche générée typographiquement, utilisée tant qu'aucune image n'a été
 * téléversée dans Sanity pour un film. Volontairement graphique (blocs de
 * couleur, gros caractères) pour que la grille reste forte visuellement même
 * avant l'ajout des vraies affiches par le client.
 */
export function GeneratedPoster({ title, director, year, seed, className = "" }: GeneratedPosterProps) {
  const variant = hashString(seed) % 5;

  const base = "relative flex h-full w-full flex-col overflow-hidden";

  if (variant === 0) {
    return (
      <div className={`${base} bg-ink text-paper ${className}`}>
        <div className="flex flex-1 items-stretch justify-between p-4">
          <span className="font-display text-[11px] tracking-widest opacity-70">
            {year || ""}
          </span>
          <span className="font-display vertical-rl text-[clamp(2.2rem,10vw,4.5rem)] leading-[0.85] tracking-tightest break-words">
            {title}
          </span>
          <span />
        </div>
        <div className="border-t border-paper/25 p-4 font-display text-[10px] tracking-widest opacity-70">
          {director}
        </div>
      </div>
    );
  }

  if (variant === 1) {
    return (
      <div className={`${base} border border-ink/70 bg-paper text-ink ${className}`}>
        <div className="flex items-center justify-between p-4 font-display text-[10px] tracking-widest">
          <span>{director}</span>
          <span>{year}</span>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-center">
          <span className="stroke-text break-words font-display text-[clamp(2rem,9vw,4rem)] leading-[0.86]">
            {title}
          </span>
        </div>
        <div className="h-2 bg-ink" />
      </div>
    );
  }

  if (variant === 2) {
    return (
      <div className={`${base} bg-red text-paper ${className}`}>
        <div
          className="absolute inset-0 bg-ink"
          style={{ clipPath: "polygon(0 55%, 100% 30%, 100% 100%, 0% 100%)" }}
        />
        <div className="relative z-10 p-4 font-display text-[10px] tracking-widest">
          {year} — {director}
        </div>
        <div className="relative z-10 mt-auto break-words p-4 font-display text-[clamp(1.9rem,8.5vw,3.6rem)] leading-[0.86]">
          {title}
        </div>
      </div>
    );
  }

  if (variant === 3) {
    return (
      <div className={`${base} bg-blue text-paper ${className}`}>
        <div className="break-words p-4 font-display text-[clamp(1.9rem,8.5vw,3.6rem)] leading-[0.86]">
          {title}
        </div>
        <div className="mt-auto flex items-end justify-between p-4">
          <span className="font-display text-[10px] tracking-widest">{director}</span>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-[11px] text-paper">
            {year}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${base} bg-ink text-paper ${className}`}>
      <div className="m-3 flex flex-1 flex-col border border-paper/40 p-4">
        <div className="flex-1" />
        <div className="break-words font-display text-[clamp(1.8rem,8vw,3.4rem)] leading-[0.86]">{title}</div>
        <div className="mt-3 flex justify-between border-t border-paper/30 pt-2 font-display text-[10px] tracking-widest opacity-80">
          <span>{director}</span>
          <span>{year}</span>
        </div>
      </div>
    </div>
  );
}
