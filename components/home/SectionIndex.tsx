import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

const items = [
  { href: "/films", num: "01", title: "Films", desc: "La programmation actuelle, en affiches." },
  { href: "/agenda", num: "02", title: "Agenda", desc: "Toutes les séances, jour par jour." },
  { href: "/histoire", num: "03", title: "Histoire", desc: "Le Zinéma depuis 2001." },
  { href: "/annonces", num: "04", title: "Annonces", desc: "Cycles, brunchs, nouvelles du lieu." },
  { href: "/infos-pratiques", num: "05", title: "Infos pratiques", desc: "Adresse, horaires, accès." },
];

export function SectionIndex() {
  return (
    <section className="border-b border-ink/15 px-4 py-10 md:px-8 md:py-16">
      <p className="font-display text-xs tracking-widen text-ink/70">SOMMAIRE</p>
      <ul className="mt-4">
        {items.map((item, i) => (
          <Reveal key={item.href} delay={i * 0.05}>
            <li className="border-t border-ink/15 last:border-b">
              <Link
                href={item.href}
                className="group flex flex-col gap-1 py-4 md:flex-row md:items-baseline md:gap-6 md:py-6"
              >
                <span className="font-display text-xs text-ink/60 md:w-10">{item.num}</span>
                <span className="font-display text-[11vw] leading-[0.9] tracking-tightest transition-transform duration-300 ease-editorial group-hover:translate-x-3 md:flex-1 md:text-[4.4vw] md:group-hover:translate-x-6">
                  {item.title}
                </span>
                <span className="max-w-xs font-display text-xs tracking-widen text-ink/65 md:text-right">
                  {item.desc}
                </span>
              </Link>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
