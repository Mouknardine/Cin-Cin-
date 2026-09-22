/* ============================================================
   Chaque film a SA salle.

   Le cinéma veut qu'un film reste dans la salle où il a commencé :
   le public le retrouve au même endroit d'une séance à l'autre, et la
   cabine ne change pas de copie à chaque vague. Le tirage au sort ne
   décide donc plus de la salle — seulement du jour et du moment de la
   soirée. Changer un film de salle reste un geste simple, mais c'est
   un geste VOULU (menu ⋮ d'une séance → « Passer en Salle 2 »).

   Comment la salle d'un film est choisie :

     1. il joue déjà cette semaine → la salle où il joue le plus ;
     2. sinon il jouait la semaine d'avant → la salle d'alors ;
     3. sinon, c'est un nouveau venu → la salle qui a le moins de
        films, pour que les deux salles tournent à peu près autant.

   Ce fichier ne parle ni à Sanity ni à React : il se vérifie tout
   seul dans verifications/repartition.mjs.
   ============================================================ */
import type {NomDeSalle} from '../../../salles'
import {SALLES_STANDARD} from './creneaux-standards'
import type {Alea} from './regles-hasard'

/** Une séance, réduite à ce qui dit où joue un film. */
export interface PassageEnSalle {
  filmId: string
  salle: string
}

/** Ce qui a déjà été programmé, du plus parlant au moins parlant. */
export interface HistoriqueDesSalles {
  /** Les séances déjà posées sur la semaine qu'on remplit. */
  semaine: readonly PassageEnSalle[]
  /** Les séances de la semaine d'avant. */
  semainePrecedente: readonly PassageEnSalle[]
}

function estSalleStandard(salle: string): salle is NomDeSalle {
  return (SALLES_STANDARD as readonly string[]).includes(salle)
}

/**
 * La salle où ce film joue le plus dans ces séances. Null s'il n'y joue
 * pas. À égalité, la première salle du programme l'emporte : le choix
 * doit être le même à chaque ouverture de l'outil.
 */
export function salleLaPlusFrequente(
  filmId: string,
  passages: readonly PassageEnSalle[],
): NomDeSalle | null {
  const comptes = new Map<NomDeSalle, number>()
  for (const passage of passages) {
    if (passage.filmId !== filmId || !estSalleStandard(passage.salle)) continue
    comptes.set(passage.salle, (comptes.get(passage.salle) ?? 0) + 1)
  }
  let meilleure: NomDeSalle | null = null
  for (const salle of SALLES_STANDARD) {
    const nombre = comptes.get(salle) ?? 0
    if (nombre > 0 && (meilleure === null || nombre > (comptes.get(meilleure) ?? 0))) {
      meilleure = salle
    }
  }
  return meilleure
}

/** La salle qui a, pour l'instant, le moins de films. À égalité, au hasard. */
function salleLaMoinsChargee(
  films: ReadonlyMap<string, NomDeSalle>,
  alea: Alea,
): NomDeSalle {
  const nombre = (salle: NomDeSalle): number =>
    [...films.values()].filter((autre) => autre === salle).length
  const minimum = Math.min(...SALLES_STANDARD.map(nombre))
  const candidates = SALLES_STANDARD.filter((salle) => nombre(salle) === minimum)
  return candidates[Math.floor(alea() * candidates.length)] ?? SALLES_STANDARD[0]
}

/**
 * Donne une salle à chaque film retenu.
 *
 * Les films déjà installés gardent la leur. Les nouveaux venus vont,
 * un par un et dans le désordre, dans la salle la moins chargée.
 */
export function attribuerLesSalles(
  filmIds: readonly string[],
  historique: HistoriqueDesSalles,
  alea: Alea = Math.random,
): Map<string, NomDeSalle> {
  const salles = new Map<string, NomDeSalle>()
  const nouveaux: string[] = []

  for (const filmId of filmIds) {
    const connue =
      salleLaPlusFrequente(filmId, historique.semaine) ??
      salleLaPlusFrequente(filmId, historique.semainePrecedente)
    if (connue) salles.set(filmId, connue)
    else nouveaux.push(filmId)
  }

  /* L'ordre d'arrivée des nouveaux est tiré au sort : sinon le premier
     de la liste alphabétique finirait toujours en Salle 1. */
  const melanges = [...nouveaux]
  for (let i = melanges.length - 1; i > 0; i -= 1) {
    const j = Math.floor(alea() * (i + 1))
    ;[melanges[i], melanges[j]] = [melanges[j], melanges[i]]
  }
  for (const filmId of melanges) salles.set(filmId, salleLaMoinsChargee(salles, alea))

  return sansSalleVide(salles, historique, alea)
}

/**
 * Une salle sans aucun film resterait vide toute la semaine. Si l'autre
 * en a au moins deux, l'un d'eux déménage — de préférence un film qui
 * ne joue pas encore cette semaine : il n'a pas encore de public
 * habitué à le trouver dans cette salle-là.
 */
function sansSalleVide(
  salles: Map<string, NomDeSalle>,
  historique: HistoriqueDesSalles,
  alea: Alea,
): Map<string, NomDeSalle> {
  for (const vide of SALLES_STANDARD) {
    const occupants = [...salles.values()].filter((salle) => salle === vide).length
    if (occupants > 0) continue
    const pleine = autreSalle(vide)
    const candidats = [...salles.entries()]
      .filter(([, salle]) => salle === pleine)
      .map(([filmId]) => filmId)
    if (candidats.length < 2) continue
    const pasEncoreCetteSemaine = candidats.filter(
      (filmId) => salleLaPlusFrequente(filmId, historique.semaine) === null,
    )
    const choix = pasEncoreCetteSemaine.length > 0 ? pasEncoreCetteSemaine : candidats
    salles.set(choix[Math.floor(alea() * choix.length)] ?? choix[0], vide)
  }
  return salles
}

/** L'autre salle ordinaire : Salle 1 ↔ Salle 2. Null pour le Hall-Bar. */
export function autreSalle(salle: string): NomDeSalle | null {
  if (!estSalleStandard(salle)) return null
  return SALLES_STANDARD.find((autre) => autre !== salle) ?? null
}
