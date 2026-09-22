/* ============================================================
   Les films d'une semaine de planning, tels que le compteur les
   montre : tous les films à l'affiche — même ceux qui n'ont encore
   aucune séance (« 0 ») —, plus tout film programmé cette semaine,
   rangés par titre.

   C'est aussi cette liste qui distribue les couleurs (couleurs.ts) :
   chaque film de la semaine reçoit la sienne, dans l'ordre, sans
   qu'un film absent de la semaine vienne « user » une teinte.

   Ce fichier ne fait que des calculs.
   ============================================================ */
import type {FilmPlanning, SeancePlanning} from '../types'

/** Les films qu'on s'attend à voir programmés, même sans séance encore. */
const STATUTS_A_PROGRAMMER = ['a-laffiche', 'avant-premiere', 'cycle']

/** Un film de la semaine : son nombre de séances et ses salles. */
export interface FilmDeLaSemaine {
  filmId: string
  titre: string
  nombre: number
  salles: string[]
}

export function filmsDeLaSemaine(
  films: readonly FilmPlanning[],
  seances: readonly SeancePlanning[],
): FilmDeLaSemaine[] {
  const parFilm = new Map<string, FilmDeLaSemaine>()
  for (const film of films) {
    if (!STATUTS_A_PROGRAMMER.includes(film.statut ?? '')) continue
    parFilm.set(film._id, {filmId: film._id, titre: film.titre, nombre: 0, salles: []})
  }
  /* Un film programmé cette semaine compte toujours, même s'il n'est
     plus « à l'affiche » (une reprise, un film terminé). */
  for (const seance of seances) {
    const ligne = parFilm.get(seance.filmId) ?? {
      filmId: seance.filmId,
      titre: seance.filmTitre,
      nombre: 0,
      salles: [],
    }
    ligne.nombre += 1
    if (!ligne.salles.includes(seance.salle)) ligne.salles.push(seance.salle)
    parFilm.set(seance.filmId, ligne)
  }
  return [...parFilm.values()].sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
}
