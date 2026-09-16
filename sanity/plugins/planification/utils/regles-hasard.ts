/* ============================================================
   Les règles de bon sens d'une grille tirée au sort.

   Un tirage vraiment aléatoire donnerait des semaines
   inutilisables : le même film dans les deux salles au même moment,
   ou quatre fois le mercredi et jamais le samedi. Ce fichier dit ce
   qu'on cherche à éviter, et à quel point.

   Tout se raisonne en VAGUES — celle de 19 h, celle de 21 h — et
   jamais en heures : la séance de 21 h peut partir à 21:15 parce que
   le film d'avant était long, elle n'en reste pas moins la séance du
   soir face à celle de l'autre salle.

   Ce ne sont pas des interdits mais des PÉNALITÉS : si aucune
   solution parfaite n'existe — trop peu de films pour trop de
   créneaux — l'outil préfère une semaine imparfaite à une semaine
   incomplète. Les pénalités se comparent entre elles, seule leur
   échelle relative compte.
   ============================================================ */
import type {CreneauOrdinaire} from './creneaux-standards'

/** Une source de hasard : renvoie un nombre entre 0 (inclus) et 1 (exclu). */
export type Alea = () => number

/** Le même film deux fois dans la même vague : les deux salles au même moment. */
const PENALITE_MEME_VAGUE = 10_000

/** Le même film deux fois le même jour. */
const PENALITE_MEME_JOUR = 1_000

/** Le même film toujours sur la même vague : une fois de plus à 19 h, une fois de plus le poids. */
const PENALITE_MEME_MOMENT = 10

/** Le même film toujours dans la même salle. */
const PENALITE_MEME_SALLE = 3

/**
 * Le film ne tient pas dans la case : la salle est reprise avant qu'il
 * ne soit fini. C'est la pénalité la plus lourde — une grille bancale
 * vaut mieux qu'une séance impossible — mais elle reste une pénalité,
 * pour que le tirage n'ait jamais nulle part où se poser.
 */
const PENALITE_NE_RENTRE_PAS = 100_000

/** Ce film tient-il sur cette case ? Par défaut, tout tient. */
export type Convient = (filmId: string, creneau: CreneauOrdinaire) => boolean

const TOUT_CONVIENT: Convient = () => true

/** Un film posé sur une case : ce que le tirage et la retouche manipulent. */
export interface Place extends CreneauOrdinaire {
  filmId: string
}

/** Ce qu'on retient des films déjà posés, pour juger du placement suivant. */
export interface Historique {
  parJour: Map<string, Set<string>>
  parVague: Map<string, Set<string>>
  parMoment: Map<string, number>
  parSalle: Map<string, number>
}

function historiqueVide(): Historique {
  return {parJour: new Map(), parVague: new Map(), parMoment: new Map(), parSalle: new Map()}
}

function ensemble(index: Map<string, Set<string>>, clef: string): Set<string> {
  const existant = index.get(clef)
  if (existant) return existant
  const nouveau = new Set<string>()
  index.set(clef, nouveau)
  return nouveau
}

/**
 * Ce que coûte le fait de poser ce film sur cette case : plus la note est
 * basse, meilleure est l'idée. `restant` est le nombre de séances qu'il
 * reste à caser pour ce film.
 */
export function noterPlacement(
  filmId: string,
  creneau: CreneauOrdinaire,
  histoire: Historique,
  restant: number,
  alea: Alea,
  convient: Convient = TOUT_CONVIENT,
): number {
  let note = convient(filmId, creneau) ? 0 : PENALITE_NE_RENTRE_PAS
  if (ensemble(histoire.parVague, `${creneau.date}|${creneau.vague}`).has(filmId)) {
    note += PENALITE_MEME_VAGUE
  }
  if (ensemble(histoire.parJour, creneau.date).has(filmId)) note += PENALITE_MEME_JOUR
  note += PENALITE_MEME_MOMENT * (histoire.parMoment.get(`${filmId}|${creneau.vague}`) ?? 0)
  note += PENALITE_MEME_SALLE * (histoire.parSalle.get(`${filmId}|${creneau.salle}`) ?? 0)
  /* Placer d'abord les films qui ont encore beaucoup de séances à caser :
     ce sont eux qui, laissés pour la fin, n'auraient plus que de mauvaises
     places. */
  note -= restant
  /* Un soupçon de hasard pour départager deux placements équivalents. */
  return note + alea()
}

/** Inscrit un placement dans l'historique, pour peser sur les suivants. */
export function enregistrerPlacement(
  filmId: string,
  creneau: CreneauOrdinaire,
  histoire: Historique,
): void {
  ensemble(histoire.parJour, creneau.date).add(filmId)
  ensemble(histoire.parVague, `${creneau.date}|${creneau.vague}`).add(filmId)
  const clefMoment = `${filmId}|${creneau.vague}`
  const clefSalle = `${filmId}|${creneau.salle}`
  histoire.parMoment.set(clefMoment, (histoire.parMoment.get(clefMoment) ?? 0) + 1)
  histoire.parSalle.set(clefSalle, (histoire.parSalle.get(clefSalle) ?? 0) + 1)
}

/**
 * L'historique des séances DÉJÀ posées sur la période, pour que les
 * nouvelles s'y ajoutent sans retomber dessus : un film qui joue déjà
 * mercredi soir ne sera pas reproposé au même moment dans l'autre salle.
 */
export function historiqueDesSeances(places: readonly Place[]): Historique {
  const histoire = historiqueVide()
  for (const place of places) enregistrerPlacement(place.filmId, place, histoire)
  return histoire
}
