/**
 * Ce qui rend une séance particulière, en une ligne : « Avant-première ·
 * En présence de la réalisatrice Jeanne Dupont · Suivie d'une rencontre ».
 *
 * Demande du cinéma (3 novembre 2026) : la newsletter de la semaine et la
 * feuille à imprimer doivent dire qu'une projection est spéciale. Rien de
 * nouveau à saisir : tout est déjà dans Sanity.
 *
 *   - la projection annoncée par la fiche du film (avant-première,
 *     première, projection extraordinaire) : la marque que porte sa séance ;
 *   - l'invité·e de la fiche du film (« Séance en présence de… ») : le jour
 *     écrit dans la fiche, ou toutes ses séances s'il n'y en a pas ;
 *   - la « Mention particulière » de la séance elle-même.
 *
 * Ce fichier ne fait que du texte : il se vérifie hors du Studio
 * (verifications/newsletter.mjs et verifications/impression.mjs).
 */
import {NOM_DE_LA_PROJECTION, estUneProjection} from '../utils/projection-de-la-fiche'

/** Ce qu'une séance dit d'elle-même. */
export interface SeanceAParticularite {
  date: string
  /** La marque d'une séance tenue par la fiche du film (« avant-premiere »…). */
  projection?: string | null
  /** La « Mention particulière » écrite sur la séance. */
  mention?: string | null
}

/** Ce que la fiche du film dit de son invité·e. */
export interface InviteDuFilm {
  presence?: string | null
  presenceDate?: string | null
}

function propre(texte: unknown): string {
  return typeof texte === 'string' ? texte.trim() : ''
}

/** L'invité·e est-il là ce jour-là ? Sans jour dans la fiche, il l'est à chaque séance. */
function inviteCeJour(film: InviteDuFilm, date: string): string {
  const invite = propre(film.presence)
  if (!invite) return ''
  const jour = propre(film.presenceDate)
  return !jour || jour === date ? invite : ''
}

/**
 * Les morceaux de la particularité, dans l'ordre où on les lit : la nature
 * de la projection, l'invité·e, puis la mention de la séance. Une mention
 * qui redit l'un des deux premiers n'est pas répétée.
 */
export function particulariteDeLaSeance(seance: SeanceAParticularite, film: InviteDuFilm): string[] {
  const morceaux: string[] = []
  if (estUneProjection(seance.projection)) morceaux.push(NOM_DE_LA_PROJECTION[seance.projection])
  const invite = inviteCeJour(film, seance.date)
  if (invite) morceaux.push(`En présence de ${invite}`)
  const mention = propre(seance.mention)
  const dejaDit = morceaux.some((morceau) => morceau.toLocaleLowerCase('fr-CH') === mention.toLocaleLowerCase('fr-CH'))
  if (mention && !dejaDit) morceaux.push(mention)
  return morceaux
}

/** La particularité en une seule ligne, ou null pour une séance ordinaire. */
export function texteParticularite(morceaux: readonly string[] | null | undefined): string | null {
  return morceaux && morceaux.length ? morceaux.join(' · ') : null
}
