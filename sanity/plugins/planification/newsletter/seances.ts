/**
 * Les séances d'un film dans la newsletter, en pastilles.
 *
 * LA NEWSLETTER PART LE LUNDI.
 *
 * La semaine de cinéma va du mercredi au mardi, mais l'abonné reçoit le
 * message deux jours plus tôt. Le lundi et le mardi qui précèdent sont donc
 * encore devant lui : ses pastilles commencent là, et vont jusqu'au mardi de
 * la semaine annoncée. Ce qui est déjà passé le jour de l'envoi n'y figure pas.
 *
 * ---------------------------------------------------------------------------
 * UNE PASTILLE EST UN PETIT TABLEAU, DANS UNE GRILLE.
 *
 * Le cinéma colle sa newsletter dans Outlook, qui la réécrit avant de
 * l'envoyer. Tout ce qui n'est pas un simple tableau s'y perd : des liens
 * encadrés se collaient en un seul cadre (5 octobre 2026), des tableaux
 * flottants s'empilaient en grandes cases sur iPhone (3 novembre 2026).
 * Chaque pastille est donc une case de tableau, et les pastilles sont
 * rangées dans une grille de deux colonnes (voir pastillesDesSeances).
 * ---------------------------------------------------------------------------
 */
import {ajouterJours, formatJourAbrege, numeroDuJour} from '../utils/dates'
import type {SeanceNewsletter} from './donnees'
import {BLANC, ENCRE, POLICE, TAILLE, TRAIT, capitales, echapper} from './html'

/** Du lundi de l'envoi au mercredi qui ouvre la semaine : deux jours. */
const JOURS_ENTRE_ENVOI_ET_SEMAINE = 2

/** Le lundi où part la newsletter, deux jours avant la semaine qu'elle annonce. */
export function jourDeLEnvoi(debutSemaine: string): string {
  return ajouterJours(debutSemaine, -JOURS_ENTRE_ENVOI_ET_SEMAINE)
}

/** Les séances non annulées, du lundi de l'envoi au mardi de la semaine annoncée. */
export function seancesAnnoncees(seances: SeanceNewsletter[], debutSemaine: string, finSemaine: string): SeanceNewsletter[] {
  const envoi = jourDeLEnvoi(debutSemaine)
  return seances.filter(
    (seance) => seance.statut !== 'annule' && seance.date >= envoi && seance.date <= finSemaine,
  )
}

/** Le texte d'une pastille. mso-line-height-rule fait respecter l'interligne à Word. */
function textePastille(encre: string): string {
  return (
    `font-family:${POLICE};font-size:${TAILLE.petit};line-height:1.3;mso-line-height-rule:exactly;` +
    `font-weight:bold;text-transform:uppercase;white-space:nowrap;text-align:left;color:${encre};`
  )
}

/** La marge intérieure d'une pastille : serrée, pour tenir à deux par rangée sur un petit téléphone. */
const MARGE_PASTILLE = '5px 7px'

/** L'écart entre deux pastilles, horizontal comme vertical. */
const ECART = 6

/** Deux pastilles par rangée : la largeur d'un téléphone le permet toujours. */
const PAR_RANGEE = 2

/**
 * Une séance en pastille cadrée, sur toute la largeur de sa case. Elle mène
 * à la fiche du film, où l'on achète son billet : une cible large pour le
 * pouce.
 *
 * La marge intérieure est portée par le lien, pour que toute la pastille se
 * clique. Word ignore la marge d'un lien : il la reçoit sur la case, par
 * mso-padding-alt, qu'il est seul à lire. Les espaces sont insécables :
 * « LUN 5 19:00 » ne se coupe jamais en deux.
 */
function puceHoraire(seance: SeanceNewsletter, lien: string | null, speciale: boolean): string {
  /* Une séance spéciale (avant-première, invité·e…) s'inverse : encre
     pleine, texte blanc. Elle se repère parmi les autres. */
  const encre = speciale ? BLANC : ENCRE
  const fond = speciale ? `background-color:${ENCRE};` : ''
  const TEXTE_PASTILLE = textePastille(encre)
  const contenu =
    `${echapper(capitales(formatJourAbrege(seance.date)))}&nbsp;${echapper(numeroDuJour(seance.date))}` +
    `&nbsp;&nbsp;<span style="font-weight:normal;">${echapper(seance.heure)}</span>`
  const interieur = lien
    ? `<a href="${lien}" style="display:block;padding:${MARGE_PASTILLE};${TEXTE_PASTILLE}text-decoration:none;">${contenu}</a>`
    : `<span style="display:block;padding:${MARGE_PASTILLE};${TEXTE_PASTILLE}">${contenu}</span>`
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">` +
    `<tr><td nowrap style="${TRAIT}${fond}padding:0;mso-padding-alt:${MARGE_PASTILLE};${TEXTE_PASTILLE}">${interieur}</td></tr>` +
    `</table>`
  )
}

/** Une case de la grille : la pastille, et l'écart à sa droite et en dessous. */
function caseDeLaGrille(contenu: string, derniereDeLaRangee: boolean): string {
  const droite = derniereDeLaRangee ? 0 : ECART
  return (
    `<td width="50%" valign="top" style="width:50%;padding:0 ${droite}px ${ECART}px 0;` +
    `font-family:${POLICE};">${contenu}</td>`
  )
}

/**
 * Les pastilles des séances annoncées, ou rien.
 *
 * ---------------------------------------------------------------------------
 * UNE VRAIE GRILLE, PAS DES PASTILLES QUI FLOTTENT.
 *
 * Les pastilles étaient des petits tableaux « align=left », posés côte à
 * côte comme des mots. En passant par Outlook, ce placement se perdait :
 * reçues sur un iPhone, elles s'empilaient une par ligne en grandes cases
 * vides, et l'affiche se retrouvait écrasée dans un coin (signalé par le
 * cinéma le 3 novembre 2026, capture à l'appui).
 *
 * Elles sont donc rangées dans un tableau ordinaire de deux colonnes, la
 * seule mise en page que toutes les messageries respectent — Word compris.
 * Deux colonnes tiennent sur l'écran le plus étroit ; sur un ordinateur, la
 * grille reste à deux, alignée et régulière.
 * ---------------------------------------------------------------------------
 */
export function pastillesDesSeances(
  seances: SeanceNewsletter[],
  lien: string | null,
  estSpeciale: (seance: SeanceNewsletter) => boolean = () => false,
): string {
  if (!seances.length) return ''
  const rangees: string[] = []
  for (let debut = 0; debut < seances.length; debut += PAR_RANGEE) {
    const cases = seances.slice(debut, debut + PAR_RANGEE).map((seance) => puceHoraire(seance, lien, estSpeciale(seance)))
    while (cases.length < PAR_RANGEE) cases.push('&nbsp;')
    rangees.push(`<tr>${cases.map((contenu, rang) => caseDeLaGrille(contenu, rang === PAR_RANGEE - 1)).join('')}</tr>`)
  }
  return (
    `<div style="padding-top:10px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
    `style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">` +
    `${rangees.join('')}</table></div>`
  )
}
