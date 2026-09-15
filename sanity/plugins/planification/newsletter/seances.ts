/**
 * Les séances d'un film dans la newsletter, en pastilles.
 *
 * LA NEWSLETTER PART LE LUNDI.
 *
 * La semaine de cinéma va du mercredi au mardi, mais l'abonné reçoit le
 * message deux jours plus tôt. Le lundi et le mardi qui précèdent sont donc
 * encore devant lui : ses pastilles commencent là, et vont jusqu'au mardi de
 * la semaine annoncée. Ce qui est déjà passé le jour de l'envoi n'y figure pas.
 */
import {ajouterJours, formatJourAbrege, numeroDuJour} from '../utils/dates'
import type {SeanceNewsletter} from './donnees'
import {ENCRE, TAILLE, TRAIT, echapper} from './html'

/** Du lundi de l'envoi au mercredi qui ouvre la semaine : deux jours. */
const JOURS_ENTRE_ENVOI_ET_SEMAINE = 2

/** Les séances non annulées, du lundi de l'envoi au mardi de la semaine annoncée. */
export function seancesAnnoncees(seances: SeanceNewsletter[], debutSemaine: string, finSemaine: string): SeanceNewsletter[] {
  const envoi = ajouterJours(debutSemaine, -JOURS_ENTRE_ENVOI_ET_SEMAINE)
  return seances.filter(
    (seance) => seance.statut !== 'annule' && seance.date >= envoi && seance.date <= finSemaine,
  )
}

/**
 * Une séance en pastille cadrée — celles de la fiche film du site. Chacune
 * mène à la fiche, où l'on achète son billet : une cible large pour le pouce.
 */
function puceHoraire(seance: SeanceNewsletter, lien: string | null): string {
  const style =
    `display:inline-block;margin:0 6px 6px 0;padding:5px 8px;${TRAIT}color:${ENCRE};` +
    `font-size:${TAILLE.petit};line-height:1.3;font-weight:bold;text-transform:uppercase;` +
    `text-decoration:none;white-space:nowrap;`
  const contenu =
    `${echapper(formatJourAbrege(seance.date))} ${echapper(numeroDuJour(seance.date))}` +
    `&nbsp; <span style="font-weight:normal;">${echapper(seance.heure)}</span>`
  return lien ? `<a href="${lien}" style="${style}">${contenu}</a>` : `<span style="${style}">${contenu}</span>`
}

/** Les pastilles des séances annoncées, ou rien. */
export function pastillesDesSeances(seances: SeanceNewsletter[], lien: string | null): string {
  if (!seances.length) return ''
  return `<div style="padding-top:10px;">${seances.map((seance) => puceHoraire(seance, lien)).join('')}</div>`
}
