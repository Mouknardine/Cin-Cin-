import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { Hero } from "@/components/home/Hero";
import { PosterWall } from "@/components/home/PosterWall";
import { SectionIndex } from "@/components/home/SectionIndex";
import { WeekStrip } from "@/components/home/WeekStrip";
import { getAnnouncements, getFilms, getScreenings, getSiteSettings } from "@/lib/content";

export default async function HomePage() {
  const [films, screenings, announcements, settings] = await Promise.all([
    getFilms(),
    getScreenings(),
    getAnnouncements(),
    getSiteSettings(),
  ]);

  const featured = films.filter((f) => f.featuredHome && f.status !== "passe");
  const wallFilms = featured.length ? featured : films.filter((f) => f.status === "a-laffiche");
  const heroFilms = films.filter((f) => f.status !== "passe").slice(0, 8);
  const pinned = announcements.find((a) => a.pinned) || announcements[0];

  return (
    <>
      <Hero tagline={settings.tagline} films={heroFilms} />
      <AnnouncementBanner announcement={pinned} />
      <section className="border-b border-ink/15 py-10 md:py-16">
        <div className="mb-6 flex items-baseline justify-between px-4 md:px-8">
          <p className="font-display text-xs tracking-widen text-ink/60">À L&apos;AFFICHE</p>
          <a href="/films" className="underline-hover font-display text-xs tracking-widen">
            Tous les films →
          </a>
        </div>
        <PosterWall films={wallFilms} />
      </section>
      <WeekStrip screenings={screenings} />
      <SectionIndex />
    </>
  );
}
