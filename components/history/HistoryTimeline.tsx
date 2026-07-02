"use client";

import { Reveal } from "@/components/motion/Reveal";
import { useHistory, useSiteSettings } from "@/lib/sanity/useContent";

function renderBody(body: unknown): string {
  if (typeof body === "string") return body;
  if (Array.isArray(body)) {
    return body
      .map((block: any) =>
        block?.children?.map((c: any) => c.text).join("") || ""
      )
      .join("\n\n");
  }
  return "";
}

// Lu directement dans le navigateur à chaque visite : le contenu Sanity
// publié apparaît sans jamais reconstruire le site.
export function HistoryTimeline() {
  const entries = useHistory();
  const settings = useSiteSettings();

  return (
    <>
      <Reveal className="mx-4 mb-14 border-y border-ink/15 py-8 md:mx-8 md:py-12">
        <p className="max-w-3xl whitespace-pre-line font-display text-2xl leading-[1.1] tracking-tightest md:text-4xl">
          {settings.historyIntro ||
            "Pendant que les grandes salles rétrécissaient leurs rangées pour multiplier les écrans, le Zinéma a fait le pari inverse : une salle généreuse, pensée pour rassembler un public plutôt que le fragmenter en micro-écrans."}
        </p>
      </Reveal>

      <ol className="relative mx-4 border-l border-ink/20 pl-6 md:mx-8 md:pl-12">
        {entries.map((entry, i) => {
          const bodyText = renderBody(entry.body);
          return (
            <Reveal key={entry._id} delay={i * 0.06}>
              <li className="relative mb-20 last:mb-0 md:mb-28">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-ink md:-left-[51px]" />
                <p className="font-display text-[15vw] leading-[0.8] tracking-tightest text-ink/10 md:text-[6vw]">
                  {entry.year}
                </p>
                <div className="-mt-6 md:-mt-10">
                  <p className="font-display text-xs tracking-widen text-red">{entry.year}</p>
                  <h2 className="mt-2 font-display text-2xl tracking-tightest md:mt-3 md:text-3xl">
                    {entry.title}
                  </h2>
                  {bodyText && (
                    <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-ink/75 md:mt-5">
                      {bodyText}
                    </p>
                  )}
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>
    </>
  );
}
