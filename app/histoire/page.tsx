import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { getHistory } from "@/lib/content";

export const metadata: Metadata = {
  title: "Histoire — Zinéma",
  description: "Le Zinéma, cinéma indépendant à Lausanne, depuis 2001.",
};

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

export default async function HistoirePage() {
  const entries = await getHistory();

  return (
    <div className="py-8 md:py-12">
      <div className="px-4 pb-8 md:px-8 md:pb-10">
        <p className="font-display text-xs tracking-widen text-ink/50">03 — HISTOIRE</p>
        <h1 className="mt-3 font-display text-[16vw] leading-[0.85] tracking-tightest md:text-[6vw]">
          Depuis 2001
        </h1>
      </div>

      <Reveal className="mx-4 mb-14 border-y border-ink/15 py-8 md:mx-8 md:py-12">
        <p className="max-w-3xl font-display text-2xl leading-[1.1] tracking-tightest md:text-4xl">
          Pendant que les grandes salles rétrécissaient leurs rangées pour
          multiplier les écrans, le Zinéma a fait le pari inverse&nbsp;: une
          salle généreuse, pensée pour rassembler un public plutôt que le
          fragmenter en micro-écrans.
        </p>
      </Reveal>

      <ol className="relative mx-4 border-l border-ink/20 pl-6 md:mx-8 md:pl-12">
        {entries.map((entry, i) => {
          const bodyText = renderBody(entry.body);
          return (
            <Reveal key={entry._id} delay={i * 0.06}>
              <li className="relative mb-14 last:mb-0">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-ink md:-left-[51px]" />
                <p className="font-display text-[15vw] leading-[0.8] tracking-tightest text-ink/10 md:text-[6vw]">
                  {entry.year}
                </p>
                <div className="-mt-6 md:-mt-10">
                  <p className="font-display text-xs tracking-widen text-red">{entry.year}</p>
                  <h2 className="mt-1 font-display text-2xl tracking-tightest md:text-3xl">
                    {entry.title}
                  </h2>
                  {bodyText && (
                    <p className="mt-3 max-w-2xl whitespace-pre-line text-base leading-relaxed text-ink/75">
                      {bodyText}
                    </p>
                  )}
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
