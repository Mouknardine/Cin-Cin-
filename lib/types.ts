export type FilmStatus =
  | "a-laffiche"
  | "avant-premiere"
  | "prochainement"
  | "cycle"
  | "passe";

export type PosterSize = "large" | "medium" | "small";

export type ScreeningStatus = "disponible" | "complet" | "annule";

export interface SanityImg {
  asset?: { _ref?: string; _id?: string };
  hotspot?: { x: number; y: number };
  alt?: string;
}

export interface Review {
  _id: string;
  quote: string;
  author?: string;
  source?: string;
  url?: string;
}

export interface Screening {
  _id: string;
  date: string;
  time: string;
  room?: string;
  versionNote?: string;
  status: ScreeningStatus;
  price?: string;
  sumupCheckoutUrl?: string;
  film?: {
    _id: string;
    title: string;
    slug: string;
    director?: string;
    poster?: SanityImg;
  };
}

export interface Film {
  _id: string;
  title: string;
  slug: string;
  originalTitle?: string;
  director: string;
  year?: number;
  country?: string;
  duration?: number;
  language?: string;
  subtitles?: string;
  ageRating?: string;
  genres?: string[];
  status: FilmStatus;
  synopsis?: string;
  posterSize: PosterSize;
  featuredHome?: boolean;
  poster: SanityImg;
  stillImages?: SanityImg[];
  trailerUrl?: string;
  review?: Review;
  price?: string;
  sumupCheckoutUrl?: string;
  screenings?: Screening[];
}

export interface Announcement {
  _id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  image?: SanityImg;
  excerpt?: string;
  body?: unknown;
  linkUrl?: string;
  pinned?: boolean;
}

export interface HistoryEntry {
  _id: string;
  year: string;
  title: string;
  body?: unknown;
  image?: SanityImg;
  order: number;
}

export interface OpeningHour {
  label: string;
  value: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  tagline?: string;
  seoDescription?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: OpeningHour[];
  accessInfo?: unknown;
  mapUrl?: string;
  socialLinks?: SocialLink[];
}
