/* ============================================================
   Les cases sans film : ce que la grille de la Planification
   propose, à côté des films, pour dire qu'il n'y a pas de film
   ce jour-là (demande du cinéma, 18 novembre 2026).

   Une case sans film se pose comme une séance — un jour, une
   heure, une salle — mais ce n'est PAS une séance : elle a son
   propre type de fiche (« sansFilm »). La billetterie, la
   newsletter, la feuille imprimée et les pages des films ne la
   voient donc jamais. Seuls la grille et l'agenda du site
   l'affichent.

   Deux genres :
     - « Projection privée » tient sa salle, à son heure, comme
       un film le ferait ;
     - « Vacances » ferme toute la journée : aucun assistant n'y
       pose de film, dans aucune salle, et l'agenda l'annonce une
       seule fois, sans heure ni salle.

   Pour en ajouter un, une ligne ici suffit côté Studio. Côté site,
   assets/js/agenda-jours.js tient la liste des genres qui prennent
   toute la journée : verifications/cases-sans-film.mjs vérifie que
   les deux disent la même chose.
   ============================================================ */

export interface GenreSansFilm {
  /** Le texte affiché, tel quel, dans la grille et sur l'agenda. */
  libelle: string
  /** Vrai si le genre ferme toute la journée, toutes salles. */
  toutLeJour: boolean
}

export const GENRES_SANS_FILM = [
  {libelle: 'Projection privée', toutLeJour: false},
  {libelle: 'Vacances', toutLeJour: true},
] as const satisfies readonly GenreSansFilm[]

export type LibelleSansFilm = (typeof GENRES_SANS_FILM)[number]['libelle']

export const LIBELLES_SANS_FILM: readonly LibelleSansFilm[] = GENRES_SANS_FILM.map(
  (genre) => genre.libelle,
)

/** Ce libellé ferme-t-il toute la journée ? Un libellé inconnu ne ferme rien. */
export function prendToutLeJour(libelle: string): boolean {
  return GENRES_SANS_FILM.some((genre) => genre.libelle === libelle && genre.toutLeJour)
}

export function estUnLibelleSansFilm(valeur: unknown): valeur is LibelleSansFilm {
  return typeof valeur === 'string' && (LIBELLES_SANS_FILM as readonly string[]).includes(valeur)
}
