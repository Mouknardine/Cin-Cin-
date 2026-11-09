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

/* Ce qui rend la séance particulière — « Avant-première · En présence de
   la réalisatrice » — se lit dans la même case que le titre, après une
   virgule : « WE ARE MAKING A FILM ABOUT MARK FISHER, EN PRÉSENCE DE… ».
   La mention seule passe en gras, le titre reste en maigre comme les autres
   séances (la newsletter, elle, est déjà toute en gras). Le texte passe à
   la ligne : la séance prend une, deux ou trois lignes de hauteur selon sa
   longueur (demande du cinéma, 9 novembre 2026). La hauteur se recalcule et
   la feuille tient toujours sur une page. Au-delà de trois lignes, la
   mention se termine par des points de suspension. */
const LIGNES_MAX_D_UNE_SEANCE = 3
/* La place d'une ligne du titre, en millimètres : la page, moins les marges,
   l'heure, la salle et le blanc de part et d'autre du texte (voir styles.ts). */
const LARGEUR_DU_TITRE = 210 - 2 * 12 - 17 - 30 - 2 * 3
/* La largeur d'une lettre, en fraction de la taille du texte : capitales
   d'Arial, en maigre et en gras. On calcule au plus grand texte possible
   (3,6 mm) pour commencer, puis à la taille réellement utilisée (voir
   tailleDeCalcul) : plus le texte rapetisse, plus il en tient. Une marge de
   3 % tient compte des mots qui ne se coupent pas. Largeurs mesurées sur
   les capitales d'Arial, espaces compris. */
const LARGEUR_LETTRE_MAIGRE = 0.58
const LARGEUR_LETTRE_GRAS = 0.63
const TAILLE_MAX_DU_TEXTE = 3.6
const TAILLE_MIN_DU_TEXTE = 2
const PLACE_UTILE = LARGEUR_DU_TITRE * 0.97

/** Le nombre de lignes de hauteur qu'une séance occupe : de une à trois. */
function lignesDeLaSeance(seance: SeanceProgramme, taille: number): number {
  const complet = seance.statut === 'complet' ? ' · Complet'.length : 0
  const titre = seance.titre.length + (seance.particularite ? 2 : 0) + complet
  const mention = seance.particularite?.length ?? 0
  const largeur =
    (titre * LARGEUR_LETTRE_MAIGRE + mention * LARGEUR_LETTRE_GRAS) * taille
  return Math.min(LIGNES_MAX_D_UNE_SEANCE, Math.max(1, Math.ceil(largeur / PLACE_UTILE)))
}

function texteDuTitre(seance: SeanceProgramme): string {
  const complet = seance.statut === 'complet' ? ' <span class="complet">· Complet</span>' : ''
  if (!seance.particularite) return `${echapper(seance.titre)}${complet}`
  return (
    `<span class="titre-long">${echapper(seance.titre)}, ` +
    `<span class="mention">${echapper(seance.particularite)}</span>${complet}</span>`
  )
}

function ligneDeSeance(seance: SeanceProgramme, taille: number): string {
  const hauteur = lignesDeLaSeance(seance, taille)
  const classe = ['seance', seance.particularite ? 'speciale' : '', hauteur > 1 ? `lignes-${hauteur}` : '']
    .filter(Boolean)
    .join(' ')
  return (
    `<tr class="${classe}">` +
    `<td class="heure">${echapper(seance.heure)}</td>` +
    `<td class="titre">${texteDuTitre(seance)}</td>` +
    `<td class="salle">${echapper(seance.salle)}</td>` +
    `</tr>`
  )
}

function lignesDuTableau(programme: readonly SeanceProgramme[], taille: number): string {
  if (programme.length === 0) {
    return `<tr class="seance"><td colspan="3" class="vide">Aucune séance cette semaine.</td></tr>`
  }
  return [...parJour(programme)]
    .map(([date, seances]) => ligneDuJour(date) + seances.map((seance) => ligneDeSeance(seance, taille)).join(''))
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

/** Le nombre de lignes d'un tableau : une par jour, puis une à trois par séance selon sa longueur. */
function nombreDeLignes(programme: readonly SeanceProgramme[], taille: number): number {
  const deSeances = programme.reduce((total, seance) => total + lignesDeLaSeance(seance, taille), 0)
  return deSeances + parJour(programme).size
}

/** Le bandeau de la semaine : une ligne comme les autres, de la même hauteur. */
const LIGNE_DU_BANDEAU = 1

/** Les lignes de la semaine : une semaine vide en garde une, qui le dit. */
function lignesDeLaSemaine(programme: readonly SeanceProgramme[], taille: number): number {
  return Math.max(nombreDeLignes(programme, taille), 1)
}

/**
 * La taille du texte d'après laquelle on compte les lignes des séances. Le
 * texte rapetisse quand les lignes se multiplient, et plus il est petit,
 * moins une mention a besoin de lignes. On cherche la plus petite taille
 * « sûre » : celle où la page, une fois ses lignes comptées à cette taille,
 * donne un texte qui n'est pas plus grand qu'elle. On ne compte alors jamais
 * moins de lignes que la page n'en demandera. La plus grande taille (3,6 mm)
 * l'est toujours ; on resserre par dichotomie.
 */
function tailleDeCalcul(
  programme: readonly SeanceProgramme[],
  lundiEtMardi: readonly SeanceProgramme[],
): number {
  const tailleObtenue = (taille: number): number =>
    mesuresDeLaFeuille(
      LIGNE_DU_BANDEAU + lignesDeLaSemaine(programme, taille) + nombreDeLignes(lundiEtMardi, taille),
    ).tailleTexte
  let sure = TAILLE_MAX_DU_TEXTE
  let basse = TAILLE_MIN_DU_TEXTE
  for (let essai = 0; essai < 20; essai++) {
    const milieu = (sure + basse) / 2
    if (tailleObtenue(milieu) <= milieu) sure = milieu
    else basse = milieu
  }
  return sure
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
  const taille = tailleDeCalcul(programme, lundiEtMardi)
  const mesures = mesuresDeLaFeuille(
    LIGNE_DU_BANDEAU + lignesDeLaSemaine(programme, taille) + nombreDeLignes(lundiEtMardi, taille),
  )
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
  const taille = tailleDeCalcul(donnees.programme, lundiEtMardi)
  const lignesGrisees = nombreDeLignes(lundiEtMardi, taille)
  const lignesSemaine = lignesDeLaSemaine(donnees.programme, taille)
  const total = lignesGrisees + LIGNE_DU_BANDEAU + lignesSemaine
  /* Toutes les lignes se partagent la page : celles du lundi et du mardi
     comptent comme les autres, le bandeau de la semaine aussi, et chacun
     reçoit sa part de la hauteur — elles ont donc toutes la même taille. */
  const mesures = mesuresDeLaFeuille(total)
  const titre = titreDeLaFeuille(donnees.debutSemaine, donnees.finSemaine)
  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<title>${echapper(titre)}</title><style>${stylesDeLaFeuille(mesures)}</style></head><body>` +
    `<div class="feuille">` +
    `<img class="logo" src="${echapper(logo)}" alt="ZINÉMA">` +
    (lignesGrisees
      ? tableau(lignesDuTableau(lundiEtMardi, taille), part(mesures.hauteurTableau, lignesGrisees, total), 'grise')
      : '') +
    `<div class="titre-semaine">${echapper(titre)}</div>` +
    tableau(lignesDuTableau(donnees.programme, taille), part(mesures.hauteurTableau, lignesSemaine, total)) +
    `</div></body></html>`
  )
}
