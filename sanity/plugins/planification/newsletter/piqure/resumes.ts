/**
 * Ce que la liste à cocher dit de chaque film et de chaque événement, pour
 * qu'on choisisse sans ouvrir les fiches : la prochaine séance, la séance
 * spéciale s'il y en a une, les prochaines dates d'un événement.
 */
import {libelleDuTypeEvenement} from '../../../../typesEvenement'
import {formatJourLong} from '../../utils/dates'
import {particulariteDe} from '../donnees'
import {periodeEnClair, prochainesDates} from '../rendez-vous'
import type {EvenementEnAvant, FilmEnAvant} from './candidats'

function avecMajuscule(texte: string): string {
  return texte.charAt(0).toLocaleUpperCase('fr-CH') + texte.slice(1)
}

/** « vendredi 20 novembre à 20:00 » */
function jourEtHeure(date: string, heure: string | null | undefined): string {
  const jour = formatJourLong(date)
  return heure?.trim() ? `${jour} à ${heure.trim()}` : jour
}

export interface ResumeDuFilm {
  /** « Prochaine séance : jeudi 19 novembre à 18:00 · 4 séances en 7 jours » */
  prochaine: string
  /** « Vendredi 20 novembre à 20:00 — En présence du réalisateur », ou null. */
  speciale: string | null
}

export function resumeDuFilm({film, seances, pastilles}: FilmEnAvant): ResumeDuFilm {
  const [prochaine] = seances
  const nombre = pastilles.length
  /* Insécables : « 3 séances en 7 jours » passe à la ligne d'un bloc, sans se couper. */
  const compte = nombre > 1 ? ` ·\u00a0${nombre}\u00a0séances\u00a0en\u00a07\u00a0jours` : ''
  const speciale = seances
    .map((seance) => ({seance, texte: particulariteDe(seance, film)}))
    .find((ligne) => Boolean(ligne.texte))
  return {
    prochaine: prochaine ? `Prochaine séance : ${jourEtHeure(prochaine.date, prochaine.heure)}${compte}` : '',
    speciale: speciale ? `${avecMajuscule(jourEtHeure(speciale.seance.date, speciale.seance.heure))} — ${speciale.texte}` : null,
  }
}

/** « Spectacle · samedi 12 décembre à 20:00 · Hall-Bar », ou sa période sans soirée notée. */
export function resumeDeLEvenement({evenement}: EvenementEnAvant, envoi: string): string {
  const type = libelleDuTypeEvenement(evenement.typeNom, evenement.ancienType)
  const soiree = prochainesDates(evenement, envoi)[0]
  const periode = periodeEnClair(evenement, envoi) ?? 'en cours'
  const quand = soiree
    ? [jourEtHeure(soiree.date, soiree.heure), soiree.salle?.trim()].filter(Boolean).join(' · ')
    : periode.charAt(0).toLocaleLowerCase('fr-CH') + periode.slice(1)
  return avecMajuscule([type, quand].filter(Boolean).join(' · '))
}
