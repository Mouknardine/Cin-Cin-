/* ============================================================
   Changer un film de salle, pour toute la semaine, en un geste.

   Un film reste dans sa salle (salles-attitrees.ts) — mais le jour où
   on veut l'installer dans l'autre, il ne faut pas avoir à déplacer
   ses séances une par une. Ce fichier calcule le déménagement :

     - chaque séance ordinaire du film passe dans l'autre salle, au
       même jour et au même moment de la soirée ;
     - si la place est prise, le film qui l'occupe fait le chemin
       inverse : les deux ÉCHANGENT leurs places, personne n'est
       supprimé ni recouvert.

   L'heure de la séance de 21 h est remise à 21:00 : c'est l'outil qui
   la repousse ensuite au bon quart d'heure si le film de 19 h de sa
   nouvelle salle déborde (voir enchainement.ts). Les séances
   particulières (Hall-Bar, avant-première à 18 h) ne bougent pas.

   Ce fichier ne fait que des calculs : il se vérifie tout seul dans
   verifications/repartition.mjs.
   ============================================================ */
import type {SeancePlanning} from '../types'
import {HORS_GRILLE, VAGUES, vagueDeLaSeance} from './creneaux-standards'
import type {Deplacement} from './deplacements'

/** L'heure d'une séance posée sur cette vague, avant tout recalage. */
function heureSurLaVague(seance: SeancePlanning, vague: number): string {
  return vague === 0 ? seance.heure : (VAGUES[vague]?.heureAuPlusTot ?? seance.heure)
}

/**
 * Les déplacements qui font passer toutes les séances ordinaires de ce
 * film dans `versSalle`, en échangeant avec les films qui s'y trouvent.
 */
export function deplacementsPourChangerDeSalle(
  seancesSemaine: readonly SeancePlanning[],
  filmId: string,
  versSalle: string,
): Deplacement[] {
  const deplacements: Deplacement[] = []
  for (const seance of seancesSemaine) {
    if (seance.filmId !== filmId || seance.salle === versSalle) continue
    const vague = vagueDeLaSeance(seance)
    if (vague === HORS_GRILLE) continue

    const occupant = seancesSemaine.find(
      (autre) =>
        autre.date === seance.date &&
        autre.salle === versSalle &&
        vagueDeLaSeance(autre) === vague,
    )
    /* Le film joue déjà au même moment dans l'autre salle : le
       déplacer ferait un doublon. On laisse cette séance-là. */
    if (occupant?.filmId === filmId) continue

    deplacements.push({
      id: seance._id,
      vers: {date: seance.date, heure: heureSurLaVague(seance, vague), salle: versSalle},
    })
    if (occupant) {
      deplacements.push({
        id: occupant._id,
        vers: {date: seance.date, heure: heureSurLaVague(occupant, vague), salle: seance.salle},
      })
    }
  }
  return deplacements
}
