import { PosterCanvas } from "@/components/home/PosterCanvas";
import { getFilms } from "@/lib/content";

export default async function HomePage() {
  const films = await getFilms();
  // Les films cochés « Mettre en avant sur l'accueil » dans Sanity passent
  // en tête du canevas ; les films passés n'y figurent jamais.
  const activeFilms = films
    .filter((f) => f.status !== "passe")
    .sort((a, b) => Number(Boolean(b.featuredHome)) - Number(Boolean(a.featuredHome)));

  return <PosterCanvas films={activeFilms} />;
}
