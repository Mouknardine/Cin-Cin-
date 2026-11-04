/**
 * La piqûre de rappel : les événements qui reviennent — un match d'impro
 * par mois, un ciné-club du dimanche — rappelés dans chaque newsletter
 * (demande du cinéma, 3 novembre 2026).
 *
 * Rien à réécrire chaque semaine. Dans la fiche de l'événement, on coche
 * « Le rappeler dans chaque newsletter » et on note ses dates une fois pour
 * toutes. Chaque newsletter annonce alors les prochaines, et le rappel
 * s'arrête tout seul après la dernière date, ou après le dernier jour de
 * l'événement.
 *
 *   ┌──────────┬──────────────────────────────┐
 *   │ visuel   │ type, titre                  │
 *   │          │ JEUDI 6 NOVEMBRE · 20:00 · … │
 *   ├──────────┴──────────────────────────────┤
 *   │ résumé — en pleine largeur              │
 *   └─────────────────────────────────────────┘
 */
import {libelleDuTypeEvenement} from '../../../typesEvenement'
import {formatJourLong} from '../utils/dates'
import {
  ENCRE, PAPIER, ROUGE, SITE, TAILLE,
  bandeau, capitales, cellule, echapper, paragraphes, tableau,
} from './html'
import {urlImage, type OptionsImage} from './image'

/** Une date de l'événement, telle que la fiche la donne. */
export interface DateDeRendezVous {
  date: string
  heure: string | null
  salle: string | null
}

/** Un événement à rappeler, tel que Sanity le renvoie. */
export interface EvenementNewsletter {
  _id: string
  titre: string
  slug: string | null
  typeNom: string | null
  ancienType: string | null
  resume: string | null
  dateDebut: string | null
  dateFin: string | null
  /** Le visuel vertical de l'accueil s'il existe, sinon le visuel de l'événement. */
  imageRef: string | null
  rendezVous: DateDeRendezVous[] | null
}

/**
 * La requête : les événements cochés « rappel », commencés au plus tard le
 * dernier jour de la semaine annoncée, et pas encore finis le jour de
 * l'envoi. Attend $envoi et $finSemaine.
 */
export const REQUETE_RENDEZ_VOUS = `*[_type == "evenement" && rappelNewsletter == true
  && dateDebut <= $finSemaine && (!defined(dateFin) || dateFin >= $envoi)]
  | order(dateDebut asc){
    _id,
    "titre": title,
    "slug": coalesce(slug.current, _id),
    "typeNom": typeEvenement,
    "ancienType": category,
    "resume": excerpt,
    dateDebut,
    dateFin,
    "imageRef": coalesce(imageAccueil.asset._ref, image.asset._ref),
    "rendezVous": rendezVous[defined(date)]{date, heure, salle}
  }`

/** On rappelle les trois prochaines dates : au-delà, la case devient une liste. */
const DATES_MAX = 3

/** Les prochaines dates, à partir du jour de l'envoi, dans la période de l'événement. */
export function prochainesDates(evenement: EvenementNewsletter, envoi: string): DateDeRendezVous[] {
  return (evenement.rendezVous ?? [])
    .filter((rdv) => typeof rdv.date === 'string' && rdv.date >= envoi)
    .filter((rdv) => !evenement.dateDebut || rdv.date >= evenement.dateDebut)
    .filter((rdv) => !evenement.dateFin || rdv.date <= evenement.dateFin)
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.heure ?? '').localeCompare(String(b.heure ?? '')))
    .slice(0, DATES_MAX)
}

/**
 * Les événements à rappeler. Un événement dont toutes les dates sont passées
 * n'a plus rien à rappeler : il sort, même si son dernier jour n'est pas
 * encore atteint. Sans aucune date notée, il est rappelé sans date.
 */
export function rendezVousARappeler(
  evenements: readonly EvenementNewsletter[],
  envoi: string,
): EvenementNewsletter[] {
  return evenements.filter((evenement) => {
    const notees = (evenement.rendezVous ?? []).length
    return notees === 0 || prochainesDates(evenement, envoi).length > 0
  })
}

const LARGEUR_VISUEL = 180

function lienDeLEvenement(slug: string | null): string | null {
  const propre = String(slug ?? '').trim()
  return propre ? echapper(`${SITE}/evenements/?e=${encodeURIComponent(propre)}`) : null
}

/** « JEUDI 6 NOVEMBRE · 20:00 · HALL-BAR » */
function ligneDeDate(rdv: DateDeRendezVous): string {
  const morceaux = [formatJourLong(rdv.date), rdv.heure, rdv.salle].filter(
    (morceau): morceau is string => typeof morceau === 'string' && morceau.trim() !== '',
  )
  return `<div style="padding-top:5px;">${echapper(capitales(morceaux.join(' · ')))}</div>`
}

function caseVisuel(evenement: EvenementNewsletter, image: Omit<OptionsImage, 'largeur'>, lien: string | null): string {
  const adresse = urlImage(evenement.imageRef, {...image, largeur: LARGEUR_VISUEL * 2})
  if (!adresse) return ''
  const img =
    `<img src="${adresse}" width="${LARGEUR_VISUEL}" alt="${echapper(evenement.titre)}" ` +
    `style="display:block;width:100%;max-width:${LARGEUR_VISUEL}px;height:auto;border:0;">`
  return lien ? `<a href="${lien}" style="display:block;line-height:0;text-decoration:none;">${img}</a>` : img
}

function blocEvenement(evenement: EvenementNewsletter, envoi: string, image: Omit<OptionsImage, 'largeur'>): string {
  const lien = lienDeLEvenement(evenement.slug)
  const type = libelleDuTypeEvenement(evenement.typeNom, evenement.ancienType)
  const titre = echapper(capitales(evenement.titre))
  const dates = prochainesDates(evenement, envoi)

  const entete =
    (type
      ? `<div style="font-size:${TAILLE.petit};line-height:1.4;font-weight:bold;letter-spacing:0.08em;` +
        `text-transform:uppercase;padding-bottom:4px;">${echapper(capitales(type))}</div>`
      : '') +
    `<div style="font-size:${TAILLE.titre};line-height:1.15;font-weight:bold;text-transform:uppercase;">` +
    (lien ? `<a href="${lien}" style="color:${ENCRE};text-decoration:none;">${titre}</a>` : titre) +
    `</div>` +
    (dates.length
      ? `<div style="font-size:${TAILLE.petit};line-height:1.4;mso-line-height-rule:exactly;font-weight:bold;` +
        `letter-spacing:0.02em;text-transform:uppercase;color:${ROUGE};padding-top:4px;">` +
        dates.map(ligneDeDate).join('') +
        `</div>`
      : '')

  const visuel = caseVisuel(evenement, image, lien)
  const resume = paragraphes(evenement.resume, `font-size:${TAILLE.texte};line-height:1.5;`)
  const etageHaut =
    '<tr>' +
    (visuel
      ? cellule(visuel, `width:30%;background-color:${PAPIER};padding:0;font-size:0;line-height:0;`, 'width="30%" valign="top"')
      : '') +
    cellule(entete, 'padding:12px 14px;', 'valign="top"') +
    '</tr>'
  const etageBas = resume
    ? `<tr>${cellule(resume, 'padding:12px 14px 5px;', visuel ? 'colspan="2"' : '')}</tr>`
    : ''
  return `<tr>${cellule(tableau(etageHaut + etageBas), 'padding:0;')}</tr>`
}

/** La rubrique « Rendez-vous », ou rien s'il n'y a aucun rappel cette semaine. */
export function rubriqueRendezVous(
  evenements: readonly EvenementNewsletter[] | undefined,
  envoi: string,
  image: Omit<OptionsImage, 'largeur'>,
): string {
  const aRappeler = rendezVousARappeler(evenements ?? [], envoi)
  if (!aRappeler.length) return ''
  return bandeau('Rendez-vous') + aRappeler.map((evenement) => blocEvenement(evenement, envoi, image)).join('')
}
