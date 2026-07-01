import createImageUrlBuilder from "@sanity/image-url";
import type { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";
import { projectId, dataset } from "@/sanity/env";
import type { SanityImg } from "@/lib/types";

const builder = projectId
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function hasRealImage(img?: SanityImg): boolean {
  return Boolean(img?.asset?._ref || img?.asset?._id);
}

export function urlFor(img: SanityImg): ImageUrlBuilder | null {
  if (!builder || !hasRealImage(img)) return null;
  return builder.image(img as never);
}
