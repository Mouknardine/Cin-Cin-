/**
 * La feuille A4 du programme de la semaine, prête à imprimer.
 *
 * C'est la feuille que le cinéma affiche et pose sur le comptoir : le logo
 * en haut, la semaine dans un bandeau noir, puis chaque jour et ses séances
 * — l'heure, le titre, la salle. Elle reprend la mise en page de celle qu'il
 * imprimait déjà ; la salle s'y écrit en gras et en capitales, comme dans
 * la newsletter (demande du cinéma, 29 septembre 2026).
 *
 * TOUJOURS UNE SEULE PAGE.
 *
 * La hauteur des lignes se calcule d'après leur nombre (mesures.ts) : une
 * semaine chargée se resserre, une semaine calme respire, et la page ne
 * déborde jamais. C'est vérifié par verifications/impression.mjs.
 *
 * Ce fichier ne fait que du texte : aucune dépendance au Studio, pour
 * pouvoir le vérifier hors du navigateur.
 */
import {echapper} from '../newsletter/html'
import type {SeanceProgramme} from '../newsletter/donnees'
import {formatJourLong, formatJourLongAvecAnnee, numeroDeSemaine} from '../utils/dates'
import {mesuresDeLaFeuille} from './mesures'
import {stylesDeLaFeuille} from './styles'

/** Les séances regroupées par jour, dans l'ordre du programme. */
function parJour(programme: readonly SeanceProgramme[]): Map<string, SeanceProgramme[]> {
  const jours = new Map<string, SeanceProgramme[]>()
  for (const seance of programme) {
    jours.set(seance.date, [...(jours.get(seance.date) ?? []), seance])
  }
  return jours
}

/** « Programme du mercredi 30 septembre au mardi 6 octobre 2026 (40) » */
export function titreDeLaFeuille(debutSemaine: string, finSemaine: string): string {
  return (
    `Programme du ${formatJourLong(debutSemaine)} au ${formatJourLongAvecAnnee(finSemaine)}` +
    ` (${numeroDeSemaine(debutSemaine)})`
  )
}

function ligneDuJour(date: string): string {
  return `<tr class="jour"><td colspan="3">${echapper(formatJourLong(date))}</td></tr>`
}

function ligneDeSeance(seance: SeanceProgramme): string {
  const complet = seance.statut === 'complet' ? ' <span class="complet">· Complet</span>' : ''
  return (
    `<tr class="seance">` +
    `<td class="heure">${echapper(seance.heure)}</td>` +
    `<td class="titre">${echapper(seance.titre)}${complet}</td>` +
    `<td class="salle">${echapper(seance.salle)}</td>` +
    `</tr>`
  )
}

function lignesDuTableau(programme: readonly SeanceProgramme[]): string {
  if (programme.length === 0) {
    return `<tr class="seance"><td colspan="3" class="vide">Aucune séance cette semaine.</td></tr>`
  }
  return [...parJour(programme)]
    .map(([date, seances]) => ligneDuJour(date) + seances.map(ligneDeSeance).join(''))
    .join('')
}

/** Ce qu'il faut pour composer la feuille d'une semaine. */
export interface DonneesFeuille {
  debutSemaine: string
  finSemaine: string
  /** Les séances de la semaine, déjà dans l'ordre du programme, sans les séances annulées. */
  programme: readonly SeanceProgramme[]
}

/** Le nombre de lignes de la feuille : une par jour, une par séance. */
function nombreDeLignes(programme: readonly SeanceProgramme[]): number {
  return programme.length + parJour(programme).size
}

/**
 * La semaine tient-elle sur une page ? Au-delà d'une soixantaine de
 * lignes, le texte deviendrait illisible : la feuille le coupe, et le
 * Studio prévient plutôt que d'imprimer une page tronquée sans le dire.
 */
export function tientSurUnePage(programme: readonly SeanceProgramme[]): boolean {
  const mesures = mesuresDeLaFeuille(nombreDeLignes(programme))
  return mesures.hauteurTotale <= mesures.place
}

/**
 * La feuille complète, en une page HTML autonome.
 *
 * `logo` est l'adresse de l'image du logo : le Studio lui donne celle de
 * son propre fichier, pour que la feuille s'imprime même sans le site.
 */
export function construireFeuille(donnees: DonneesFeuille, logo: string): string {
  const mesures = mesuresDeLaFeuille(nombreDeLignes(donnees.programme))
  const titre = titreDeLaFeuille(donnees.debutSemaine, donnees.finSemaine)
  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<title>${echapper(titre)}</title><style>${stylesDeLaFeuille(mesures)}</style></head><body>` +
    `<div class="feuille">` +
    `<img class="logo" src="${echapper(logo)}" alt="ZINÉMA">` +
    `<div class="titre-semaine">${echapper(titre)}</div>` +
    /* Les largeurs sont posées une fois pour toutes : le tableau commence
       par le bandeau d'un jour, qui court sur les trois colonnes, et ne
       peut donc pas les donner lui-même. */
    `<table><colgroup><col class="col-heure"><col><col class="col-salle"></colgroup>` +
    `${lignesDuTableau(donnees.programme)}</table>` +
    `</div></body></html>`
  )
}
