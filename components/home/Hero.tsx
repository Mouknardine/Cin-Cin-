import Image from "next/image";
import Link from "next/link";
import zinemaLogo from "@/public/zinema-logo.png";

export function Hero({ tagline }: { tagline?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-ink/15 px-4 pb-10 pt-8 md:px-8 md:pb-16 md:pt-14">
      <div className="flex items-start justify-between font-display text-[10px] tracking-widen text-ink/60 md:text-xs">
        <span>LAUSANNE — DEPUIS 2001</span>
        <span className="hidden md:inline">SALLE 1 · SALLE 2</span>
        <span>{tagline || "CINÉMA INDÉPENDANT"}</span>
      </div>

      <div className="mt-8 grid items-end gap-8 md:mt-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Image
            src={zinemaLogo}
            alt="Zinéma"
            width={520}
            height={128}
            priority
            className="h-auto w-full max-w-[360px]"
          />
        </div>
        <div className="md:col-span-8">
          <h1 className="font-display text-[15vw] leading-[0.82] tracking-tightest md:text-[7vw]">
            LE CINÉMA
            <br />
            <span className="stroke-text">D&apos;UN AUTRE</span>
            <br />
            TEMPS.
          </h1>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-4 border-t border-ink/15 pt-4 font-display text-xs tracking-widen text-ink/70 md:mt-12 md:flex-row md:items-center md:pt-6">
        <p className="max-w-md text-sm normal-case tracking-normal text-ink/80">
          Deux salles, une programmation en VO, et la conviction qu&apos;un
          cinéma de quartier peut rester avant-gardiste.
        </p>
        <div className="flex gap-6">
          <Link href="/films" className="underline-hover">
            Voir les films →
          </Link>
          <Link href="/agenda" className="underline-hover">
            Consulter l&apos;agenda →
          </Link>
        </div>
      </div>
    </section>
  );
}
