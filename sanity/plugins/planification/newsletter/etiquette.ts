/**
 * L'étiquette d'un film dans la newsletter : « 3ème semaine », « Reprise »,
 * « Sortie le mercredi 30 septembre ». La case la passe en capitales :
 * « 3ÈME SEMAINE », comme le cinéma l'écrit (demande du 5 octobre 2026).
 *
 * ---------------------------------------------------------------------------
 * ELLE SE CALCULE, ELLE NE SE SAISIT PAS.
 *
 * Le cinéma écrivait ces mentions à la main — d'où, dans son dernier envoi,
 * un « CONTINUATION2 » identique sur les sept films de la semaine, que plus
 * personne ne relisait. Une étiquette qu'il faut penser chaque semaine finit
 * toujours par mentir.
 *
 * Elle se déduit donc de deux choses déjà présentes dans Sanity : la date de
 * sortie du film, et ses séances. Il n'y a aucun champ à remplir en plus, et
 * rien ne peut se démentir.
 *
 * TOUT FILM À L'AFFICHE A SA SEMAINE.
 *
 * La date de sortie ne se saisit que pour un film « Prochainement » : un film
 * créé directement « À l'affiche » n'en a jamais, et restait sans étiquette
 * — certains films avaient leur semaine, d'autres non. Sans date de sortie,
 * la semaine se compte donc depuis sa première séance chez nous : c'est ce
 * que la fiche appelle « le jour où le film arrive chez nous ».
 * ---------------------------------------------------------------------------
 */
import {finDeSemaine, formatJourLong, semainesEntre} from '../utils/dates'
import type {FilmNewsletter} from './donnees'

/**
 * Au-delà de ce nombre de semaines, un film qui repasse n'est plus « en
 * continuation » : c'est une reprise.
 *
 * Deux mois : au Zinéma, un film tient l'affiche quelques semaines. Annoncer
 * une « 34ème semaine » serait exact et absurde — personne n'a suivi le film
 * sans interruption depuis huit mois. Passé ce seuil, l'information juste
 * n'est plus le décompte, c'est qu'il revient.
 */
export const SEUIL_REPRISE_SEMAINES = 8

/** La couleur que prend l'étiquette : à l'affiche, reprise, ou à venir. */
export type TonEtiquette = 'affiche' | 'reprise' | 'avenir'

export interface Etiquette {
  texte: string
  ton: TonEtiquette
}

/** Le film a-t-il au moins une séance non annulée dans la semaine ? */
function joueDansLaSemaine(film: FilmNewsletter, debut: string, fin: string): boolean {
  return film.seances.some(
    (seance) => seance.date >= debut && seance.date <= fin && seance.statut !== 'annule',
  )
}

/**
 * L'étiquette du film pour la semaine donnée, ou null s'il n'y a rien à dire
 * — ce qui n'arrive plus à un film à l'affiche : il a forcément une séance.
 */
export function etiquetteDuFilm(film: FilmNewsletter, debutSemaine: string): Etiquette | null {
  const fin = finDeSemaine(debutSemaine)
  const sortie = film.dateDeSortie || null
  const sortieAVenir = Boolean(sortie && sortie > fin)

  /* ---- Les films qui ne sont pas à l'affiche cette semaine ---- */
  if (!joueDansLaSemaine(film, debutSemaine, fin)) {
    const premiereSeance = film.seances.find((seance) => seance.date > fin)?.date ?? null
    const debutAnnonce = sortieAVenir ? sortie : (premiereSeance ?? sortie)
    if (!debutAnnonce) return {texte: 'Prochainement', ton: 'avenir'}

    /* Déjà sorti par le passé, et de nouveau annoncé : il revient. */
    const revient = Boolean(sortie) && !sortieAVenir
    return {
      texte: revient
        ? `Reprise dès le ${formatJourLong(debutAnnonce)}`
        : `Sortie le ${formatJourLong(debutAnnonce)}`,
      ton: revient ? 'reprise' : 'avenir',
    }
  }

  /* ---- Les films à l'affiche cette semaine ---- */
  if (sortie && sortieAVenir) return {texte: `Sortie le ${formatJourLong(sortie)}`, ton: 'avenir'}

  const arrivee = sortie ?? film.premiereProjection
  if (!arrivee) return null

  /* La semaine de l'arrivée compte pour la première. */
  const semaines = semainesEntre(arrivee, debutSemaine) + 1
  if (semaines <= 1) return {texte: '1ère semaine', ton: 'affiche'}
  if (semaines > SEUIL_REPRISE_SEMAINES) return {texte: 'Reprise', ton: 'reprise'}
  return {texte: `${semaines}ème semaine`, ton: 'affiche'}
}
