"use client";

import { Reveal } from "@/components/motion/Reveal";
import { formatLongDate } from "@/lib/dates";
import { useAnnouncements } from "@/lib/sanity/useContent";

const categoryLabels: Record<string, string> = {
  nouveaute: "Nouveauté",
  evenement: "Évènement",
  cycle: "Cycle",
  brunch: "Brunch",
  info: "Info spéciale",
};

// Lu directement dans le navigateur à chaque visite : le contenu Sanity
// publié apparaît sans jamais reconstruire le site.
export function AnnouncementsList() {
  const announcements = useAnnouncements();
  const [first, ...rest] = announcements;

  return (
    <>
      {first && (
        <Reveal className="mx-4 mb-10 border border-ink px-5 py-8 md:mx-8 md:px-10 md:py-12">
          <p className="font-display text-xs tracking-widen text-red">
            {categoryLabels[first.category] || "Annonce"} — {formatLongDate(first.date)}
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl leading-[0.95] tracking-tightest md:text-5xl">
            {first.title}
          </h2>
          {first.excerpt && (
            <p className="mt-4 max-w-xl text-base text-ink/75 md:text-lg">{first.excerpt}</p>
          )}
          {first.linkUrl && (
            <a
              href={first.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-hover mt-5 inline-block font-display text-sm tracking-widen"
            >
              En savoir plus →
            </a>
          )}
        </Reveal>
      )}

      <ul className="px-4 md:px-8">
        {rest.map((a, i) => (
          <Reveal key={a._id} delay={i * 0.05}>
            <li className="grid gap-2 border-t border-ink/15 py-6 last:border-b md:grid-cols-[160px_1fr] md:gap-8">
              <div className="font-display text-xs tracking-widen text-ink/70">
                <p>{formatLongDate(a.date)}</p>
                <p className="mt-1.5 text-ink/85">{categoryLabels[a.category] || "Annonce"}</p>
              </div>
              <div>
                <h3 className="font-display text-xl tracking-tightest md:text-2xl">{a.title}</h3>
                {a.excerpt && <p className="mt-2 max-w-2xl text-sm text-ink/70">{a.excerpt}</p>}
                {a.linkUrl && (
                  <a
                    href={a.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-hover mt-2 inline-block font-display text-xs tracking-widen"
                  >
                    En savoir plus →
                  </a>
                )}
              </div>
            </li>
          </Reveal>
        ))}
      </ul>

      {announcements.length === 0 && (
        <p className="px-4 py-16 text-center font-display text-sm tracking-widen text-ink/60 md:px-8">
          Aucune annonce publiée pour le moment.
        </p>
      )}
    </>
  );
}
