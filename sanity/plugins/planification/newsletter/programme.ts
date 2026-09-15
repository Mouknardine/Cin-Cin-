/**
 * Le programme de la semaine, du mercredi au mardi.
 *
 * Chaque jour s'ouvre par sa propre barre de couleur, en toutes lettres, puis
 * ses séances : l'heure, le titre, la salle. Une ligne par séance, bien
 * espacée — c'est la partie qu'on lit le plus vite, et le plus souvent.
 */
import {formatJourLong} from '../utils/dates'
import type {SeanceProgramme} from './donnees'
import {BLANC, BLEU, ENCRE, GRIS, JAUNE, ROUGE, TAILLE, cellule, echapper, lienDuFilm} from './html'

/** Les couleurs qui se relaient d'un jour à l'autre, jamais deux fois de suite. */
const COULEURS_DES_JOURS: {fond: string; encre: string}[] = [
  {fond: ROUGE, encre: BLANC},
  {fond: JAUNE, encre: ENCRE},
  {fond: BLEU, encre: BLANC},
]

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

/** « MERCREDI 16 SEPTEMBRE », sur toute la largeur, dans la couleur du jour. */
function barreDuJour(date: string, rang: number): string {
  const couleur = COULEURS_DES_JOURS[rang % COULEURS_DES_JOURS.length]
  return `<tr>${cellule(
    echapper(formatJourLong(date)),
    `background-color:${couleur.fond};color:${couleur.encre};padding:8px 12px;` +
      `font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;text-transform:uppercase;`,
    'colspan="3"',
  )}</tr>`
}

/** Le titre mène à la fiche du film, sans se déguiser en lien : la couleur et
    le soulignement d'une messagerie feraient de cette grille une bouillie bleue. */
function ligneDeSeance(seance: SeanceProgramme): string {
  const lien = lienDuFilm(seance.slug)
  const titre = lien
    ? `<a href="${lien}" style="color:${ENCRE};text-decoration:none;">${echapper(seance.titre)}</a>`
    : echapper(seance.titre)
  return (
    '<tr>' +
    cellule(
      echapper(seance.heure),
      `padding:10px 12px;width:52px;font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;white-space:nowrap;`,
      'width="52" valign="middle"',
    ) +
    cellule(
      titre,
      `padding:10px 12px;font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;` +
        `text-transform:uppercase;letter-spacing:-0.01em;`,
      'valign="middle"',
    ) +
    cellule(
      echapper(seance.salle),
      `padding:10px 12px;width:80px;font-size:${TAILLE.texte};line-height:1.3;color:${GRIS};` +
        `white-space:nowrap;text-align:right;`,
      'width="80" valign="middle" align="right"',
    ) +
    '</tr>'
  )
}

/** Les lignes du tableau du programme. */
export function lignesDuProgramme(programme: SeanceProgramme[]): string {
  return [...parJour(programme)]
    .map(([date, seances], rang) => barreDuJour(date, rang) + seances.map(ligneDeSeance).join(''))
    .join('')
}
