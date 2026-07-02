"use client";

import { useEffect, useState } from "react";
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

/**
 * Le site est un export statique servi tel quel (aucun serveur) : le
 * contenu Sanity est donc lu directement par le navigateur du visiteur, à
 * chaque affichage, plutôt qu'une seule fois au moment du build. Une
 * publication dans le Studio est ainsi visible immédiatement, sans jamais
 * reconstruire ni redéployer le site.
 *
 * Tant qu'aucun projet Sanity n'est configuré (ou en cas d'erreur réseau/
 * CORS), le contenu d'exemple s'affiche à la place — jamais de page vide.
 */
function useSanityQuery<T>(query: string, params: Record<string, unknown>, fallback: T): T {
  const [data, setData] = useState<T>(fallback);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    // Réinitialise sur le contenu de secours correspondant à ces nouveaux
    // paramètres (utile pour useFilmBySlug : le slug n'est connu qu'après
    // le montage, une fois l'URL lue côté client).
    setData(fallback);
    if (!isSanityConfigured || !client || !query) return;
    let cancelled = false;

    client
      .fetch<T>(query, JSON.parse(paramsKey))
      .then((result) => {
        if (cancelled || result == null) return;
        if (Array.isArray(result) && result.length === 0) return;
        setData(result);
      })
      .catch(() => {
        // Réseau, CORS non configuré, ou projet invalide : on garde le
        // contenu déjà affiché (exemple ou dernière valeur connue).
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paramsKey]);

  return data;
}

export function useFilms(): Film[] {
  return useSanityQuery<Film[]>(filmsQuery, {}, mockFilms);
}

export function useFilmBySlug(slug: string): Film | null {
  const fallback = mockFilms.find((f) => f.slug === slug) ?? null;
  return useSanityQuery<Film | null>(slug ? filmBySlugQuery : "", { slug }, fallback);
}

export function useScreenings(): Screening[] {
  return useSanityQuery<Screening[]>(screeningsQuery, {}, mockScreenings);
}

export function useAnnouncements(): Announcement[] {
  return useSanityQuery<Announcement[]>(announcementsQuery, {}, mockAnnouncements);
}

export function useHistory(): HistoryEntry[] {
  return useSanityQuery<HistoryEntry[]>(historyQuery, {}, mockHistory);
}

export function useSiteSettings(): SiteSettings {
  return useSanityQuery<SiteSettings>(siteSettingsQuery, {}, mockSiteSettings);
}
