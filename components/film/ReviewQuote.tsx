import type { Review } from "@/lib/types";

export function ReviewQuote({ review }: { review?: Review }) {
  if (!review) return null;

  const content = (
    <>
      <p className="font-display text-2xl leading-[1.05] tracking-tightest md:text-4xl">
        « {review.quote} »
      </p>
      <p className="mt-4 font-display text-xs tracking-widen text-ink/55">
        {[review.author, review.source].filter(Boolean).join(" — ")}
      </p>
    </>
  );

  return (
    <blockquote className="border-l-2 border-red pl-5 md:pl-8">
      {review.url ? (
        <a href={review.url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </blockquote>
  );
}
