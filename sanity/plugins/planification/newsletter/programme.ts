/**
 * Le programme de la semaine, du mercredi au mardi.
 *
 * Chaque jour s'ouvre par sa propre barre de couleur, en toutes lettres, puis
 * ses séances : l'heure, le titre, la salle. Une ligne par séance, bien
 * espacée — c'est la partie qu'on lit le plus vite, et le plus souvent.
 *
 * Le lundi et le mardi de l'envoi reprennent la même grille, à la même
 * taille, mais tout en grisé : ils précèdent la semaine annoncée.
 */
import {formatJourLong} from '../utils/dates'
import type {SeanceProgramme} from './donnees'
import {BLANC, BLEU, ENCRE, GRIS_CLAIR, JAUNE, ROUGE, TAILLE, cellule, echapper, lienDuFilm} from './html'

interface Couleur {
  fond: string
  encre: string
}

/** Les couleurs qui se relaient d'un jour à l'autre, jamais deux fois de suite. */
const COULEURS_DES_JOURS: Couleur[] = [
  {fond: ROUGE, encre: BLANC},
  {fond: JAUNE, encre: ENCRE},
  {fond: BLEU, encre: BLANC},
]

/* La salle s'écrit en gras et en capitales, comme le titre, pour se lire
   d'un coup d'œil (demande du cinéma, 29 septembre 2026). La colonne est
   assez large pour « HALL-BAR », le nom de salle le plus long. */
const LARGEUR_SALLE = 104

/** Les séances regroupées par date, sans rebattre l'ordre du programme. */
function parJour(programme: SeanceProgramme[]): Map<string, SeanceProgramme[]> {
  const jours = new Map<string, SeanceProgramme[]>()
  for (const seance of programme) {
    const jour = jours.get(seance.date)
    if (jour) jour.push(seance)
    else jours.set(seance.date, [seance])
  }
  return jours
}

/** Le lundi et le mardi de l'envoi : une barre grise, et des séances en gris. */
const GRISE: Couleur = {fond: GRIS_CLAIR, encre: BLANC}

/** « MERCREDI 16 SEPTEMBRE », sur toute la largeur, dans la couleur du jour. */
function barreDuJour(date: string, couleur: Couleur): string {
  return `<tr>${cellule(
    echapper(formatJourLong(date)),
    `background-color:${couleur.fond};color:${couleur.encre};padding:8px 12px;` +
      `font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;text-transform:uppercase;`,
    'colspan="3"',
  )}</tr>`
}

/** Le titre mène à la fiche du film, sans se déguiser en lien : la couleur et
    le soulignement d'une messagerie feraient de cette grille une bouillie bleue. */
function ligneDeSeance(seance: SeanceProgramme, encre: string): string {
  const lien = lienDuFilm(seance.slug)
  const titre = lien
    ? `<a href="${lien}" style="color:${encre};text-decoration:none;">${echapper(seance.titre)}</a>`
    : echapper(seance.titre)
  return (
    '<tr>' +
    cellule(
      echapper(seance.heure),
      `color:${encre};padding:10px 12px;width:52px;font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;white-space:nowrap;`,
      'width="52" valign="middle"',
    ) +
    cellule(
      titre,
      `color:${encre};padding:10px 12px;font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;` +
        `text-transform:uppercase;letter-spacing:-0.01em;`,
      'valign="middle"',
    ) +
    cellule(
      echapper(seance.salle),
      `color:${encre};padding:10px 12px;width:${LARGEUR_SALLE}px;font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;` +
        `text-transform:uppercase;white-space:nowrap;text-align:right;`,
      `width="${LARGEUR_SALLE}" valign="middle" align="right"`,
    ) +
    '</tr>'
  )
}

/** Les lignes du tableau du programme ; en grisé pour le lundi et le mardi de l'envoi. */
export function lignesDuProgramme(programme: SeanceProgramme[], grise = false): string {
  return [...parJour(programme)]
    .map(([date, seances], rang) => {
      const couleur = grise ? GRISE : COULEURS_DES_JOURS[rang % COULEURS_DES_JOURS.length]
      const encre = grise ? GRIS_CLAIR : ENCRE
      return barreDuJour(date, couleur) + seances.map((seance) => ligneDeSeance(seance, encre)).join('')
    })
    .join('')
}
