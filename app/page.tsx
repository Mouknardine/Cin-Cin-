import { PosterCanvas } from "@/components/home/PosterCanvas";
import { getFilms } from "@/lib/content";

export default async function HomePage() {
  const films = await getFilms();
  const activeFilms = films.filter((f) => f.status !== "passe");

  return <PosterCanvas films={activeFilms} />;
}
