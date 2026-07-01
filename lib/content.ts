import { client, isSanityConfigured } from "@/lib/sanity/client";
import {
  announcementsQuery,
  filmBySlugQuery,
  filmsQuery,
  historyQuery,
  screeningsQuery,
  siteSettingsQuery,
} from "@/lib/sanity/queries";
import {
  mockAnnouncements,
  mockFilms,
  mockHistory,
  mockScreenings,
  mockSiteSettings,
} from "@/lib/mock-data";
import type { Announcement, Film, HistoryEntry, Screening, SiteSettings } from "@/lib/types";

async function safeFetch<T>(query: string, params: Record<string, unknown>, fallback: T): Promise<T> {
  if (!client) return fallback;
  try {
    // Export statique : les données sont lues une seule fois, au moment du
    // "next build". Pas de revalidation ISR possible sans serveur, donc pas
    // de cache CDN Sanity ici — on veut le contenu le plus frais disponible
    // à l'instant du build.
    const result = await client.fetch<T>(query, params, { cache: "no-store" });
    if (Array.isArray(result) && result.length === 0) return fallback;
    if (result == null) return fallback;
    return result;
  } catch {
    return fallback;
  }
}

export async function getFilms(): Promise<Film[]> {
  if (!isSanityConfigured) return mockFilms;
  return safeFetch<Film[]>(filmsQuery, {}, mockFilms);
}

export async function getFilmBySlug(slug: string): Promise<Film | null> {
  if (!isSanityConfigured) {
    return mockFilms.find((f) => f.slug === slug) ?? null;
  }
  const fallback = mockFilms.find((f) => f.slug === slug) ?? null;
  return safeFetch<Film | null>(filmBySlugQuery, { slug }, fallback);
}

export async function getScreenings(): Promise<Screening[]> {
  if (!isSanityConfigured) return mockScreenings;
  return safeFetch<Screening[]>(screeningsQuery, {}, mockScreenings);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (!isSanityConfigured) return mockAnnouncements;
  return safeFetch<Announcement[]>(announcementsQuery, {}, mockAnnouncements);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  if (!isSanityConfigured) return mockHistory;
  return safeFetch<HistoryEntry[]>(historyQuery, {}, mockHistory);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSanityConfigured) return mockSiteSettings;
  return safeFetch<SiteSettings>(siteSettingsQuery, {}, mockSiteSettings);
}
