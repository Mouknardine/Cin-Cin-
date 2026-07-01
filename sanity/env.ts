export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-06-01";

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET"
);

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

// Le site est exporté en statique : les données ne sont lues qu'une fois,
// au moment du build. On veut le contenu le plus frais possible à cet
// instant plutôt que la variante mise en cache par le CDN Sanity.
export const useCdn = false;

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    return "production" as unknown as T;
  }
  return v;
}
