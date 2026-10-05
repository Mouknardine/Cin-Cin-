/**
 * La feuille A4 du programme de la semaine, prête à imprimer.
 *
 * C'est la feuille que le cinéma affiche et pose sur le comptoir : le logo
 * en haut, la semaine dans un bandeau noir, puis chaque jour et ses séances
 * — l'heure, le titre, la salle. Elle reprend la mise en page de celle qu'il
 * imprimait déjà, tout en capitales : les titres en gras, les séances en
 * maigre (demande du cinéma, 29 septembre 2026).
 *
 * Au-dessus du bandeau noir, le lundi et le mardi qui précèdent la semaine,
 * en grisé et à la même taille : la feuille s'affiche dès le lundi, et ces
 * deux soirs-là sont encore à venir (demande du cinéma, 5 octobre 2026).
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
  /** Le lundi et le mardi qui précèdent la semaine, imprimés en grisé au-dessus d'elle. */
  lundiEtMardi: readonly SeanceProgramme[]
}

/** Le nombre de lignes d'un tableau : une par jour, une par séance. */
function nombreDeLignes(programme: readonly SeanceProgramme[]): number {
  return programme.length + parJour(programme).size
}

/** Les lignes de la semaine : une semaine vide en garde une, qui le dit. */
function lignesDeLaSemaine(programme: readonly SeanceProgramme[]): number {
  return Math.max(nombreDeLignes(programme), 1)
}

/**
 * La semaine tient-elle sur une page, avec le lundi et le mardi qui la
 * précèdent ? Au-delà d'une soixantaine de lignes, le texte deviendrait
 * illisible : la feuille le coupe, et le Studio prévient plutôt que
 * d'imprimer une page tronquée sans le dire.
 */
export function tientSurUnePage(
  programme: readonly SeanceProgramme[],
  lundiEtMardi: readonly SeanceProgramme[] = [],
): boolean {
  const mesures = mesuresDeLaFeuille(lignesDeLaSemaine(programme) + nombreDeLignes(lundiEtMardi))
  return mesures.hauteurTotale <= mesures.place
}

/**
 * Un tableau de la feuille, à la hauteur qu'on lui donne. Les largeurs sont
 * posées une fois pour toutes : le tableau commence par le bandeau d'un
 * jour, qui court sur les trois colonnes, et ne peut donc pas les donner
 * lui-même.
 */
function tableau(lignes: string, hauteur: number, classe?: string): string {
  return (
    `<table${classe ? ` class="${classe}"` : ''} style="height: ${hauteur}mm;">` +
    `<colgroup><col class="col-heure"><col><col class="col-salle"></colgroup>${lignes}</table>`
  )
}

/** Une part de la hauteur, arrondie vers le bas comme toutes les mesures de la feuille. */
function part(hauteur: number, lignes: number, total: number): number {
  return Math.floor(((hauteur * lignes) / total) * 100) / 100
}

/**
 * La feuille complète, en une page HTML autonome.
 *
 * `logo` est l'adresse de l'image du logo : le Studio lui donne celle de
 * son propre fichier, pour que la feuille s'imprime même sans le site.
 */
export function construireFeuille(donnees: DonneesFeuille, logo: string): string {
  const lundiEtMardi = donnees.lundiEtMardi ?? []
  const lignesGrisees = nombreDeLignes(lundiEtMardi)
  const lignesSemaine = lignesDeLaSemaine(donnees.programme)
  const total = lignesGrisees + lignesSemaine
  /* Toutes les lignes se partagent la page : celles du lundi et du mardi
     comptent comme les autres, et chaque tableau reçoit sa part de la
     hauteur — leurs lignes ont donc toutes la même taille. */
  const mesures = mesuresDeLaFeuille(total)
  const titre = titreDeLaFeuille(donnees.debutSemaine, donnees.finSemaine)
  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<title>${echapper(titre)}</title><style>${stylesDeLaFeuille(mesures)}</style></head><body>` +
    `<div class="feuille">` +
    `<img class="logo" src="${echapper(logo)}" alt="ZINÉMA">` +
    (lignesGrisees
      ? tableau(lignesDuTableau(lundiEtMardi), part(mesures.hauteurTableau, lignesGrisees, total), 'grise')
      : '') +
    `<div class="titre-semaine">${echapper(titre)}</div>` +
    tableau(lignesDuTableau(donnees.programme), part(mesures.hauteurTableau, lignesSemaine, total)) +
    `</div></body></html>`
  )
}
