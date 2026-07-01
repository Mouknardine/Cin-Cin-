import Image from "next/image";
import { GeneratedPoster } from "@/components/poster/GeneratedPoster";
import { hasRealImage, urlFor } from "@/lib/sanity/image";
import type { Film } from "@/lib/types";

interface FilmPosterProps {
  film: Pick<Film, "title" | "director" | "year" | "poster" | "slug">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function FilmPoster({ film, className = "", sizes, priority }: FilmPosterProps) {
  if (hasRealImage(film.poster)) {
    const src = urlFor(film.poster)?.width(1200).fit("crop").url();
    if (src) {
      return (
        <Image
          src={src}
          alt={film.title}
          fill
          sizes={sizes || "(min-width: 1080px) 33vw, 100vw"}
          priority={priority}
          className={`object-cover ${className}`}
        />
      );
    }
  }
  return (
    <GeneratedPoster
      title={film.title}
      director={film.director}
      year={film.year}
      seed={film.slug}
      className={className}
    />
  );
}
