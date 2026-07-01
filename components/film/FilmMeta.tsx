import type { Film } from "@/lib/types";

const statusLabels: Record<Film["status"], string> = {
  "a-laffiche": "À l'affiche",
  "avant-premiere": "Avant-première",
  prochainement: "Prochainement",
  cycle: "Cycle",
  passe: "Passé",
};

export function statusLabel(status: Film["status"]) {
  return statusLabels[status] || status;
}

export function filmMetaLine(film: Film): string {
  const parts = [
    film.year ? String(film.year) : null,
    film.country || null,
    film.duration ? `${film.duration} min` : null,
    [film.language, film.subtitles].filter(Boolean).join(" "),
    film.ageRating || null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function FilmMeta({ film, className = "" }: { film: Film; className?: string }) {
  return (
    <div className={className}>
      <p className="font-display text-[11px] tracking-widen text-red">
        {statusLabel(film.status)}
      </p>
      <p className="mt-0.5 font-display text-lg leading-tight tracking-tightest md:text-xl">
        {film.title}
      </p>
      <p className="mt-0.5 text-xs text-ink/75">{film.director}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink/60">
        {filmMetaLine(film)}
      </p>
    </div>
  );
}
