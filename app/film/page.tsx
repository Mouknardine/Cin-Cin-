import type { Metadata } from "next";
import { FilmDetail } from "@/components/film/FilmDetail";

// Titre générique : le film demandé n'est connu qu'une fois l'URL lue dans
// le navigateur (voir FilmDetail), donc pas de titre par film possible dans
// le HTML statique. Le titre de l'onglet se met à jour dès le chargement.
export const metadata: Metadata = {
  title: "Film — Zinéma",
  description: "Fiche film : séances, bande-annonce et informations.",
};

export default function FilmPage() {
  return <FilmDetail />;
}
