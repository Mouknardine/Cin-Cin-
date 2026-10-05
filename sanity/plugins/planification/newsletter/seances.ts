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
 * UNE PASTILLE EST UN PETIT TABLEAU.
 *
 * Le cinéma colle sa newsletter dans Outlook pour Windows, qui lit le HTML
 * avec le moteur de Word. Word ignore display:inline-block et les marges :
 * les pastilles, qui étaient de simples liens encadrés, s'y collaient en un
 * seul cadre — « LUN 5 19:00MER 7 19:00… », et l'on ne voyait plus quelle
 * séance on achetait (signalé par le cinéma le 5 octobre 2026). Apple Mail
 * et les navigateurs, eux, les montraient bien : le défaut ne se voyait
 * que dans Outlook.
 *
 * Chaque pastille est donc un tableau aligné à gauche. Word, comme un
 * navigateur, pose ces tableaux l'un à côté de l'autre et passe à la ligne
 * quand la place manque. L'écart entre deux pastilles est la marge
 * intérieure d'une case (padding), que Word respecte.
 * ---------------------------------------------------------------------------
 */
import {ajouterJours, formatJourAbrege, numeroDuJour} from '../utils/dates'
import type {SeanceNewsletter} from './donnees'
import {ENCRE, POLICE, TAILLE, TRAIT, capitales, echapper} from './html'

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
const TEXTE_PASTILLE =
  `font-family:${POLICE};font-size:${TAILLE.petit};line-height:1.3;mso-line-height-rule:exactly;` +
  `font-weight:bold;text-transform:uppercase;white-space:nowrap;color:${ENCRE};`

/** La marge intérieure d'une pastille. */
const MARGE_PASTILLE = '5px 8px'

/**
 * Une séance en pastille cadrée — celles de la fiche film du site. Chacune
 * mène à la fiche, où l'on achète son billet : une cible large pour le pouce.
 *
 * La marge intérieure est portée par le lien, pour que toute la pastille se
 * clique. Word ignore la marge d'un lien : il la reçoit sur la case, par
 * mso-padding-alt, qu'il est seul à lire. Les espaces sont insécables :
 * « LUN 5 19:00 » ne se coupe jamais en deux.
 */
function puceHoraire(seance: SeanceNewsletter, lien: string | null): string {
  const contenu =
    `${echapper(capitales(formatJourAbrege(seance.date)))}&nbsp;${echapper(numeroDuJour(seance.date))}` +
    `&nbsp;&nbsp;<span style="font-weight:normal;">${echapper(seance.heure)}</span>`
  const interieur = lien
    ? `<a href="${lien}" style="display:block;padding:${MARGE_PASTILLE};${TEXTE_PASTILLE}text-decoration:none;">${contenu}</a>`
    : `<span style="display:block;padding:${MARGE_PASTILLE};${TEXTE_PASTILLE}">${contenu}</span>`
  return (
    `<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" ` +
    `style="border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;">` +
    `<tr><td style="padding:0 6px 6px 0;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">` +
    `<tr><td nowrap style="${TRAIT}padding:0;mso-padding-alt:${MARGE_PASTILLE};${TEXTE_PASTILLE}">${interieur}</td></tr>` +
    `</table></td></tr></table>`
  )
}

/**
 * Les pastilles des séances annoncées, ou rien. Le dernier bloc les arrête :
 * ce qui suit repart sous elles, jamais à côté.
 */
export function pastillesDesSeances(seances: SeanceNewsletter[], lien: string | null): string {
  if (!seances.length) return ''
  return (
    `<div style="padding-top:10px;">${seances.map((seance) => puceHoraire(seance, lien)).join('')}` +
    `<div style="clear:both;font-size:0;line-height:0;"></div></div>`
  )
}
