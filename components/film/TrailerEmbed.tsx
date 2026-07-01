import { toEmbedUrl } from "@/lib/video";

export function TrailerEmbed({ url, title }: { url?: string; title: string }) {
  const embed = toEmbedUrl(url);

  if (!embed) {
    return (
      <div
        className="relative flex aspect-video items-center justify-center border border-ink/20 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(16,15,12,0.06)_10px,rgba(16,15,12,0.06)_11px)]"
        role="img"
        aria-label="Bande-annonce à venir"
      >
        <p className="font-display text-xs tracking-widen text-ink/50">
          BANDE-ANNONCE À VENIR
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video border border-ink/20">
      <iframe
        src={embed}
        title={`Bande-annonce — ${title}`}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
