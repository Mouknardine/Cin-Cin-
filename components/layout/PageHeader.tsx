import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  return (
    <div className="px-4 pb-8 md:px-8 md:pb-10">
      <p className="font-display text-xs tracking-widen text-ink/70">{eyebrow}</p>
      <h1 className="mt-3 font-display text-[16vw] leading-[0.85] tracking-tightest md:text-[6vw]">
        {title}
      </h1>
    </div>
  );
}
