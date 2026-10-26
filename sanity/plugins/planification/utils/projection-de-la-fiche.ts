/* ============================================================
   La séance d'une avant-première ou d'une première, tenue par la
   fiche du film.

   Demande du cinéma (26 octobre 2026) : « pouvoir faire figurer
   l'heure avec la date des avant-premières », une case « Première »
   distincte, et que la séance apparaisse toute seule dans le planning
   plutôt que d'avoir à la refaire.

   Une avant-première et une première sont des rendez-vous uniques :
   un jour, une heure, une salle. On les écrit donc directement dans la
   fiche du film, sous « Où en est ce film ? », et c'est la publication
   de la fiche qui crée la séance — publiée tout de suite, donc visible
   sur l'agenda, en billetterie et dans la Planification.

   LA FICHE FAIT FOI

   La séance créée porte une marque (« evenementDuFilm ») : c'est elle
   qui la distingue des séances ordinaires du film. Dans la
   Planification, une séance marquée est épinglée — ni glissée, ni
   recalée, ni vidée, ni dupliquée : pour la déplacer, on corrige la
   fiche. Une seule source pour l'horaire, jamais deux qui se
   contredisent.

   Ce fichier ne fait que des calculs : il dit quoi écrire, sans rien
   écrire lui-même. Il se vérifie dans verifications/projection.mjs.
   ============================================================ */

/** Les statuts qui annoncent une projection unique, datée dans la fiche. */
export const STATUTS_A_PROJECTION = ['avant-premiere', 'premiere'] as const

export type StatutAProjection = (typeof STATUTS_A_PROJECTION)[number]

/** Comment on nomme chaque projection, dans le Studio comme sur le site. */
export const NOM_DE_LA_PROJECTION: Record<StatutAProjection, string> = {
  'avant-premiere': 'Avant-première',
  premiere: 'Première',
}

export function estUneProjection(statut: unknown): statut is StatutAProjection {
  return (STATUTS_A_PROJECTION as readonly unknown[]).includes(statut)
}

/**
 * Cette séance est-elle tenue par la fiche de son film ? La
 * Planification la montre alors épinglée : ni glissée, ni recalée, ni
 * vidée, ni dupliquée — elle se règle dans la fiche.
 */
export function estTenueParLaFiche(seance: {evenement?: string | null} | null | undefined): boolean {
  return Boolean(seance?.evenement)
}

/** Une heure écrite comme le veut le reste du Studio : « 20:30 ». */
export const HEURE_VALIDE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Ce que la fiche du film dit de sa projection. */
export interface ProjectionDeLaFiche {
  statut?: string | null
  date?: string | null
  heure?: string | null
  salle?: string | null
}

/** Une séance du film, telle qu'elle est enregistrée. */
export interface SeanceDuFilm {
  _id: string
  date: string
  heure: string
  salle: string
  /** La marque d'une séance tenue par la fiche, sinon null. */
  evenement: string | null
}

/** Ce qu'il faut écrire pour que les séances suivent la fiche. */
export type Operation =
  | {type: 'creer'; date: string; heure: string; salle: string; evenement: StatutAProjection}
  | {
      type: 'modifier'
      id: string
      date: string
      heure: string
      salle: string
      evenement: StatutAProjection
    }
  /* La fiche n'a plus d'horaire : la séance annoncée disparaît. */
  | {type: 'supprimer'; id: string}
  /* Le film n'est plus une avant-première : sa séance reste — elle
     a lieu, des billets ont pu être vendus — mais redevient une séance
     ordinaire, que la Planification déplace comme les autres. */
  | {type: 'detacher'; id: string}

/** La fiche donne-t-elle tout ce qu'il faut pour programmer la séance ? */
export function projectionComplete(fiche: ProjectionDeLaFiche): fiche is ProjectionDeLaFiche & {
  statut: StatutAProjection
  date: string
  heure: string
  salle: string
} {
  return (
    estUneProjection(fiche.statut) &&
    Boolean(fiche.date) &&
    HEURE_VALIDE.test(fiche.heure ?? '') &&
    Boolean(fiche.salle)
  )
}

function parHoraire(a: SeanceDuFilm, b: SeanceDuFilm): number {
  return a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure)
}

/**
 * Les écritures qui mettent les séances du film d'accord avec sa fiche.
 *
 * Republier une fiche inchangée ne produit rien : on peut publier dix
 * fois, il n'y aura jamais qu'une séance. Les séances passées ne sont
 * jamais déplacées ni supprimées — elles ont eu lieu.
 */
export function operationsPourLaFiche(
  fiche: ProjectionDeLaFiche,
  seances: readonly SeanceDuFilm[],
  aujourdhui: string,
): Operation[] {
  const marquees = seances.filter((seance) => seance.evenement)
  const aVenir = marquees.filter((seance) => seance.date >= aujourdhui).sort(parHoraire)

  if (!projectionComplete(fiche)) {
    /* Toujours une avant-première, mais sans horaire complet : on a
       effacé le jour ou l'heure. La séance annoncée s'en va. Si le film
       a changé de statut, elle reste, en séance ordinaire. */
    const type = estUneProjection(fiche.statut) ? 'supprimer' : 'detacher'
    return aVenir.map((seance) => ({type, id: seance._id}))
  }

  const {statut, date, heure, salle} = fiche
  /* La séance qui est déjà au bon horaire, même passé — sinon chaque
     publication en recréerait une —, à défaut la prochaine séance
     marquée, qu'on déplace. */
  const cible =
    marquees.find((seance) => seance.date === date && seance.heure === heure) ?? aVenir[0]

  const operations: Operation[] = []
  if (cible) {
    const aJour =
      cible.date === date &&
      cible.heure === heure &&
      cible.salle === salle &&
      cible.evenement === statut
    if (!aJour) operations.push({type: 'modifier', id: cible._id, date, heure, salle, evenement: statut})
  } else {
    /* La séance a peut-être déjà été créée à la main, dans la
       Planification, avant que la fiche sache le faire : on la reprend
       plutôt que d'en poser une seconde à côté. */
    const dejaLa = seances.find(
      (seance) => !seance.evenement && seance.date === date && seance.heure === heure,
    )
    operations.push(
      dejaLa
        ? {type: 'modifier', id: dejaLa._id, date, heure, salle, evenement: statut}
        : {type: 'creer', date, heure, salle, evenement: statut},
    )
  }

  /* Une seule séance tenue par la fiche : une autre séance marquée à
     venir redevient ordinaire plutôt que de rester épinglée pour rien. */
  for (const seance of aVenir) {
    if (seance._id !== cible?._id) operations.push({type: 'detacher', id: seance._id})
  }
  return operations
}
