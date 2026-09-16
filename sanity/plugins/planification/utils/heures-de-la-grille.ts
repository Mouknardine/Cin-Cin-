/* ============================================================
   Donner son heure à chaque case d'une grille tirée au sort.

   Le tirage (repartition.ts) décide QUI joue OÙ : un film, une salle,
   une vague. Il ne décide pas à quelle minute. C'est ici que chaque
   case reçoit son heure, en appliquant la règle d'enchainement.ts :
   19 h pour la première vague, 21 h pour la seconde — ou la fin exacte
   du film de 19 h s'il déborde.

   On y répond aussi à la question inverse : ce film TIENT-IL dans
   cette case ? Un film de 2 h 20 ne peut pas être posé à 19 h si une
   séance est déjà calée à 21 h — celle-là, on n'y touche pas.
   ============================================================ */
import {heureEnMinutes} from '../../../salles'
import {DUREE_PAR_DEFAUT_MIN} from './conflits'
import {type CreneauOrdinaire, HORS_GRILLE, VAGUES, vagueDeLaSeance} from './creneaux-standards'
import {type SeanceEnGrille, heureDeDepart, heureDepuisMinutes} from './enchainement'
import type {Place} from './regles-hasard'
/** Une case, son film, et l'heure à laquelle la séance partira. */
export interface PlaceHoraire extends Place {
  heure: string
}

/** L'occupant d'une case, tel qu'il compte pour la séance d'après. */
type Occupant = {heure: string; filmDuree: number | null}

function inscrire(
  salles: Map<string, Map<number, Occupant>>,
  clef: string,
  vague: number,
  occupant: Occupant,
): void {
  const soiree = salles.get(clef) ?? new Map<number, Occupant>()
  soiree.set(vague, occupant)
  salles.set(clef, soiree)
}

/**
 * Donne son heure à chaque case d'une grille tirée au sort.
 *
 * Les vagues sont traitées dans l'ordre : la séance de 19 h d'abord,
 * puisque c'est sa durée qui décide de l'heure de celle de 21 h. Les
 * séances déjà en salle comptent au même titre que les nouvelles — un
 * film ajouté à 21 h derrière un film de 2 h 20 déjà programmé partira
 * bien à 21 h 20.
 */
export function poserLesHeures(
  affectations: readonly Place[],
  dureeDuFilm: (filmId: string) => number | null,
  dejaEnSalle: readonly SeanceEnGrille[],
): PlaceHoraire[] {
  const salles = new Map<string, Map<number, Occupant>>()
  for (const seance of dejaEnSalle) {
    const vague = vagueDeLaSeance(seance)
    if (vague === HORS_GRILLE) continue
    inscrire(salles, `${seance.date}|${seance.salle}`, vague, {
      heure: seance.heure,
      filmDuree: seance.filmDuree,
    })
  }

  const posees: PlaceHoraire[] = []
  for (let vague = 0; vague < VAGUES.length; vague += 1) {
    for (const place of affectations) {
      if (place.vague !== vague) continue
      const clef = `${place.date}|${place.salle}`
      const precedente = vague > 0 ? (salles.get(clef)?.get(vague - 1) ?? null) : null
      const heure = heureDeDepart(vague, precedente)
      inscrire(salles, clef, vague, {heure, filmDuree: dureeDuFilm(place.filmId)})
      posees.push({...place, heure})
    }
  }
  return posees
}

/**
 * L'heure à laquelle la salle est reprise par une séance DÉJÀ programmée,
 * après le départ habituel de cette vague. Null si plus rien ne suit.
 *
 * C'est la limite qu'un film doit respecter pour tenir dans la case : un
 * film de 2 h 20 ne peut pas être posé à 19 h si une séance est déjà
 * calée à 21 h — elle, on n'y touche pas.
 */
function libreJusqua(
  creneau: CreneauOrdinaire,
  seancesExistantes: readonly SeanceEnGrille[],
): string | null {
  const depart = heureEnMinutes(VAGUES[creneau.vague]?.heureAuPlusTot ?? '')
  if (depart === null) return null
  let limite: number | null = null
  for (const seance of seancesExistantes) {
    if (seance.date !== creneau.date || seance.salle !== creneau.salle) continue
    const debut = heureEnMinutes(seance.heure)
    if (debut === null || debut <= depart) continue
    if (limite === null || debut < limite) limite = debut
  }
  return limite === null ? null : heureDepuisMinutes(limite)
}

/**
 * Ce film tient-il dans cette case ?
 *
 * On compare depuis l'heure habituelle de la vague : c'est le plus tôt où
 * la séance peut partir, donc le cas le plus favorable. Ce qui ne rentre
 * pas ici ne rentrera nulle part.
 */
export function tientDansLaCase(
  dureeMin: number | null,
  creneau: CreneauOrdinaire,
  seancesExistantes: readonly SeanceEnGrille[],
): boolean {
  const limite = libreJusqua(creneau, seancesExistantes)
  if (limite === null) return true
  const depart = heureEnMinutes(VAGUES[creneau.vague]?.heureAuPlusTot ?? '')
  const fermeture = heureEnMinutes(limite)
  if (depart === null || fermeture === null) return true
  return depart + (dureeMin ?? DUREE_PAR_DEFAUT_MIN) <= fermeture
}
