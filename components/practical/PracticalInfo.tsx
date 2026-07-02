"use client";

import { Reveal } from "@/components/motion/Reveal";
import { useSiteSettings } from "@/lib/sanity/useContent";

function renderAccess(access: unknown): string {
  if (typeof access === "string") return access;
  if (Array.isArray(access)) {
    return access
      .map((block: any) => block?.children?.map((c: any) => c.text).join("") || "")
      .join("\n");
  }
  return "";
}

// Lu directement dans le navigateur à chaque visite : le contenu Sanity
// publié apparaît sans jamais reconstruire le site.
export function PracticalInfo() {
  const settings = useSiteSettings();
  const access = renderAccess(settings.accessInfo);

  return (
    <div className="grid gap-10 border-t border-ink/15 px-4 py-10 md:grid-cols-12 md:px-8 md:py-14">
      <Reveal className="md:col-span-5">
        <p className="font-display text-xs tracking-widen text-ink/70">ADRESSE</p>
        <p className="mt-2 max-w-xs whitespace-pre-line font-display text-3xl leading-[1.05] tracking-tightest md:text-4xl">
          {settings.address || "Adresse à venir"}
        </p>
        {settings.mapUrl && (
          <a
            href={settings.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-hover mt-4 inline-block font-display text-sm tracking-widen"
          >
            Voir sur la carte →
          </a>
        )}

        <p className="mt-8 font-display text-xs tracking-widen text-ink/70">CONTACT</p>
        <div className="mt-2 flex flex-col gap-1 font-display text-xl tracking-tightest">
          {settings.phone && <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>}
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
        </div>

        {settings.socialLinks && settings.socialLinks.length > 0 && (
          <div className="mt-8 flex gap-6">
            {settings.socialLinks.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-hover font-display text-xs tracking-widen"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </Reveal>

      <Reveal delay={0.08} className="md:col-span-4">
        <p className="font-display text-xs tracking-widen text-ink/70">HORAIRES</p>
        <ul className="mt-3 flex flex-col gap-3">
          {(settings.openingHours || []).map((h) => (
            <li key={h.label} className="flex justify-between gap-4 border-b border-ink/15 pb-2">
              <span className="text-sm text-ink/70">{h.label}</span>
              <span className="font-display text-sm tracking-widen">{h.value}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.16} className="md:col-span-3">
        <p className="font-display text-xs tracking-widen text-ink/70">ACCÈS</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/70">
          {access || "Bus et métro m2, arrêt à quelques minutes. Détails à venir."}
        </p>
      </Reveal>
    </div>
  );
}
