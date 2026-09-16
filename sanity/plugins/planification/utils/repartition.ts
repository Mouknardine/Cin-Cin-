/* ============================================================
   Répartir des films sur des créneaux, au hasard mais équitablement.

   Deux besoins, une seule mécanique :

     - « Générer une semaine » : on donne des films et des créneaux
       vides, l'outil remplit la semaine ;
     - « Dupliquer en rebattant les cartes » : on reprend les films
       d'une semaine, avec leur nombre de séances, et on les
       redistribue autrement sur les mêmes créneaux.

   Le hasard est encadré par regles-hasard.ts, qui dit ce qu'une
   grille ne doit pas faire (le même film deux fois dans la même
   vague, toujours à la même heure…).

   Ce fichier ne parle ni à Sanity ni à React : il ne fait que des
   calculs. C'est ce qui permet de le vérifier tout seul —
   voir verifications/repartition.mjs.
   ============================================================ */
import type {CreneauOrdinaire} from './creneaux-standards'
import {
  type Alea,
  type Convient,
  type Place,
  enregistrerPlacement,
  historiqueDesSeances,
  noterPlacement,
} from './regles-hasard'
import {reparerParEchanges} from './retouche'

export type {Alea, Convient, Place}

/** Les réglages d'une affectation : tout est facultatif. */
export interface OptionsAffectation {
  alea?: Alea
  /** Les séances qui occupent déjà la période : on les évite, on n'y touche pas. */
  dejaPosees?: readonly Place[]
  /** Faux si ce film ne tient pas sur cette case — la salle est reprise juste après. */
  convient?: Convient
}

/** Une case, et le film qu'on a décidé d'y projeter. */
export type Affectation = Place

/** Mélange une liste sans la modifier (Fisher-Yates). */
function melanger<T>(liste: readonly T[], alea: Alea = Math.random): T[] {
  const melangee = [...liste]
  for (let i = melangee.length - 1; i > 0; i -= 1) {
    const j = Math.floor(alea() * (i + 1))
    ;[melangee[i], melangee[j]] = [melangee[j], melangee[i]]
  }
  return melangee
}

/**
 * Combien de séances donner à chaque film pour remplir `nbCreneaux` créneaux.
 *
 * Le partage vise l'égalité SUR LA DURÉE, pas seulement sur la semaine :
 * `dejaProgrammees` compte ce que chaque film a déjà à l'affiche. Un film
 * projeté six fois le mois dernier passe donc après un film projeté deux
 * fois, et les totaux se rejoignent d'eux-mêmes.
 *
 * Renvoie la liste des films à placer, un identifiant répété autant de
 * fois qu'il aura de séances.
 */
export function repartirEquitablement(
  filmIds: readonly string[],
  nbCreneaux: number,
  dejaProgrammees: Readonly<Record<string, number>> = {},
  alea: Alea = Math.random,
): string[] {
  if (filmIds.length === 0 || nbCreneaux <= 0) return []

  const total = new Map<string, number>(filmIds.map((id) => [id, dejaProgrammees[id] ?? 0]))
  const pool: string[] = []

  for (let reste = nbCreneaux; reste > 0; reste -= 1) {
    /* Le film le moins vu passe devant. À égalité, on tire au sort :
       sans cela, le premier de la liste serait systématiquement
       avantagé, et l'ordre alphabétique finirait par se voir. */
    const candidats = melanger(filmIds, alea)
    let choisi = candidats[0]
    for (const id of candidats) {
      if ((total.get(id) ?? 0) < (total.get(choisi) ?? 0)) choisi = id
    }
    total.set(choisi, (total.get(choisi) ?? 0) + 1)
    pool.push(choisi)
  }

  return pool
}

/**
 * Pose les films de `pool` sur les créneaux donnés, au mieux des règles.
 *
 * `dejaPosees` sont les séances qui occupent déjà la période : on ne les
 * touche pas, mais on évite de venir se poser à côté d'elles — un film qui
 * joue déjà mercredi 19 h ne sera pas remis mercredi 19 h dans l'autre salle.
 *
 * Il y a autant de séances créées que le plus petit des deux nombres : on
 * ne laisse pas un créneau vide s'il reste un film, et on n'invente pas de
 * créneau s'il reste des films.
 */
export function affecterFilms(
  creneaux: readonly CreneauOrdinaire[],
  pool: readonly string[],
  options: OptionsAffectation = {},
): Affectation[] {
  const {alea = Math.random, dejaPosees = [], convient} = options
  const histoire = historiqueDesSeances(dejaPosees)
  const restants = new Map<string, number>()
  for (const filmId of pool) restants.set(filmId, (restants.get(filmId) ?? 0) + 1)

  const affectations: Affectation[] = []
  /* Les créneaux sont parcourus dans le désordre : pris dans l'ordre, les
     films les plus nombreux atterriraient toujours en début de semaine, et
     la fin de semaine hériterait des restes. */
  for (const creneau of melanger(creneaux, alea)) {
    let meilleur: string | null = null
    let meilleureNote = Number.POSITIVE_INFINITY
    for (const [filmId, restant] of restants) {
      if (restant <= 0) continue
      const note = noterPlacement(filmId, creneau, histoire, restant, alea, convient)
      if (note < meilleureNote) {
        meilleureNote = note
        meilleur = filmId
      }
    }
    if (meilleur === null) break
    restants.set(meilleur, (restants.get(meilleur) ?? 0) - 1)
    enregistrerPlacement(meilleur, creneau, histoire)
    affectations.push({...creneau, filmId: meilleur})
  }

  /* Le placement pas à pas ne revient jamais sur ses pas : une seconde
     passe échange ce qui peut l'être pour effacer les doublons qu'il a
     laissés derrière lui. */
  return reparerParEchanges(affectations, dejaPosees, convient)
}
