"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks } from "@/lib/nav";

export function NavShell() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-ink/15 bg-paper/90 px-4 py-3 backdrop-blur-sm md:px-8 md:py-4">
        <Link href="/" className="relative z-10 flex items-center gap-3" aria-label="Zinéma — accueil">
          <Image
            src="/zinema-logo.png"
            alt="Zinéma"
            width={220}
            height={54}
            priority
            className="h-8 w-auto md:h-10"
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group relative z-10 flex items-center gap-3 font-display text-sm tracking-widen"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span>{open ? "Fermer" : "Menu"}</span>
          <span className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] border border-ink">
            <span
              className="h-[1.5px] w-4 bg-ink transition-transform duration-300 ease-editorial"
              style={open ? { transform: "translateY(3.5px) rotate(45deg)" } : undefined}
            />
            <span
              className="h-[1.5px] w-4 bg-ink transition-transform duration-300 ease-editorial"
              style={open ? { transform: "translateY(-3.5px) rotate(-45deg)" } : undefined}
            />
          </span>
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="fullscreen-nav"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink px-4 pb-8 pt-24 text-paper md:px-10 md:pb-12 md:pt-32"
          >
            <ul className="flex flex-1 flex-col justify-center gap-1 md:gap-2">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 + i * 0.05, ease: [0.65, 0, 0.35, 1] }}
                  className="border-b border-paper/15 py-2 md:py-3"
                >
                  <Link
                    href={link.href}
                    className="group flex items-baseline justify-between font-display text-[13vw] leading-[0.9] tracking-tightest md:text-[6.2vw]"
                  >
                    <span className="transition-transform duration-300 ease-editorial group-hover:translate-x-3 md:group-hover:translate-x-6">
                      {link.label}
                    </span>
                    <span className="hidden font-display text-base tracking-widest text-paper/50 md:block">
                      {link.num}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-col gap-4 border-t border-paper/15 pt-6 font-display text-xs tracking-widen text-paper/70 md:flex-row md:items-center md:justify-between">
              <span>Zinéma — Lausanne, cinéma indépendant depuis 2001</span>
              <Link href="/agenda" className="underline-hover text-paper">
                Voir les séances de la semaine →
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
