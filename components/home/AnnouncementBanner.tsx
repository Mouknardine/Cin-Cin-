import Link from "next/link";
import type { Announcement } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  nouveaute: "Nouveauté",
  evenement: "Évènement",
  cycle: "Cycle",
  brunch: "Brunch",
  info: "Info",
};

export function AnnouncementBanner({ announcement }: { announcement?: Announcement }) {
  if (!announcement) return null;

  return (
    <Link
      href="/annonces"
      className="group flex flex-col gap-2 border-b border-ink/15 bg-mustard px-4 py-4 text-ink transition-colors duration-300 hover:bg-ink hover:text-mustard md:flex-row md:items-center md:justify-between md:px-8"
    >
      <span className="flex items-center gap-3 font-display text-xs tracking-widen">
        <span className="border border-current px-2 py-0.5">
          {categoryLabels[announcement.category] || "Annonce"}
        </span>
        <span className="font-display text-base tracking-tightest md:text-lg">
          {announcement.title}
        </span>
      </span>
      <span className="underline-hover font-display text-xs tracking-widen">
        En savoir plus →
      </span>
    </Link>
  );
}
