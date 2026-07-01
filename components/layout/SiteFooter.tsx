import Link from "next/link";
import { navLinks } from "@/lib/nav";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-ink/15 bg-paper px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto flex max-w-[1720px] flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <p className="font-display text-2xl leading-[0.9] tracking-tightest md:text-4xl">
            Zinéma
          </p>
          <p className="mt-2 max-w-xs text-sm text-ink/70">
            {settings.tagline || "Cinéma indépendant à Lausanne"}
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 font-display text-sm tracking-widen md:flex md:gap-8">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="underline-hover">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="font-display text-sm tracking-widen text-ink/70">
          <p>{settings.address}</p>
          {settings.phone && <p className="mt-1">{settings.phone}</p>}
          {settings.email && <p className="mt-1">{settings.email}</p>}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1720px] border-t border-ink/10 pt-4 text-[11px] tracking-widen text-ink/60">
        © {new Date().getFullYear()} Zinéma, Lausanne. Site édité via Sanity.
      </p>
    </footer>
  );
}
