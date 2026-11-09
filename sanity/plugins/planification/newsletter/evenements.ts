/**
 * Les événements dans la newsletter : lesquels on annonce, et leurs soirées
 * dans le programme de la semaine (demande du cinéma, 4 novembre 2026 : « la
 * newsletter doit prendre en compte les dates des événements et s'adapter »).
 *
 * Tout vient de la fiche de l'événement, rien n'est saisi deux fois :
 *   - le premier et le dernier jour : sa période ;
 *   - « Les dates » : ses soirées, avec jour, heure et lieu ;
 *   - « Le rappeler dans chaque newsletter » : l'annoncer aussi les semaines
 *     où il n'a pas lieu.
 *
 * Les règles :
 *   1. un événement qui a lieu pendant la semaine annoncée (du lundi de
 *      l'envoi au mardi suivant) est toujours annoncé, coché ou non ;
 *   2. un événement coché « rappel » est annoncé chaque semaine, jusqu'à
 *      quatre semaines avant son premier jour, et tant qu'il lui reste une
 *      date à venir ;
 *   3. chaque soirée datée et à l'heure dite prend sa ligne dans le
 *      programme de son jour, comme une séance.
 *
 * Ce fichier ne fait que trier : il se vérifie hors du Studio
 * (verifications/seances-speciales.mjs).
 */
import {ordonnerSeances} from '../../../salles'
import {libelleDuTypeEvenement} from '../../../typesEvenement'
import {ajouterJours} from '../utils/dates'
import type {SeanceProgramme} from './donnees'
import {
  adresseDeLEvenement,
  rendezVousARappeler,
  type DateDeRendezVous,
  type EvenementNewsletter,
} from './rendez-vous'

/** Un événement coché « rappel » s'annonce jusqu'à quatre semaines à l'avance. */
export const JOURS_D_AVANCE_DU_RAPPEL = 28

/**
 * Tous les événements qui pourraient concerner la newsletter : commencés au
 * plus tard à l'horizon du rappel, et pas encore finis le jour de l'envoi.
 * Le tri fin se fait ensuite, en JavaScript. Attend $envoi et $horizon.
 */
export const REQUETE_EVENEMENTS = `*[_type == "evenement"
  && dateDebut <= $horizon && (!defined(dateFin) || dateFin >= $envoi)]
  | order(dateDebut asc){
    _id,
    "titre": title,
    "slug": coalesce(slug.current, _id),
    "typeNom": typeEvenement,
    "ancienType": category,
    "resume": excerpt,
    dateDebut,
    dateFin,
    "rappel": rappelNewsletter == true,
    "imageRef": coalesce(imageAccueil.asset._ref, image.asset._ref),
    "rendezVous": rendezVous[defined(date)]{date, heure, salle}
  }`

/**
 * Le Studio lit à la fois la version publiée d'un événement et son brouillon
 * : sans tri, un événement modifié mais pas encore publié passait deux fois
 * dans la newsletter (9 novembre 2026). On garde une seule version par
 * événement, le brouillon quand il existe : c'est ce que le cinéma vient
 * d'écrire, et la newsletter se prépare dans le Studio, avant la mise en ligne.
 */
export function uneVersionParEvenement(evenements: readonly EvenementNewsletter[]): EvenementNewsletter[] {
  const idPublie = (id: string): string => id.replace(/^drafts\./, '')
  const brouillons = new Set(evenements.filter((e) => e._id.startsWith('drafts.')).map((e) => idPublie(e._id)))
  return evenements.filter((e) => e._id.startsWith('drafts.') || !brouillons.has(e._id))
}

function datesNotees(evenement: EvenementNewsletter): DateDeRendezVous[] {
  return (evenement.rendezVous ?? []).filter((rdv) => typeof rdv.date === 'string' && rdv.date !== '')
}

/**
 * L'événement a-t-il lieu entre ces deux jours ? Avec des soirées notées,
 * ce sont elles qui comptent. Sans elles, sa période : il commence dans
 * l'intervalle, ou il le chevauche s'il a un dernier jour. Une information
 * sans dernier jour, commencée avant, n'« a pas lieu » cette semaine.
 */
export function aLieuEntre(evenement: EvenementNewsletter, debut: string, fin: string): boolean {
  const dates = datesNotees(evenement)
  if (dates.length) return dates.some((rdv) => rdv.date >= debut && rdv.date <= fin)
  const premier = evenement.dateDebut
  if (!premier) return false
  if (premier >= debut && premier <= fin) return true
  return Boolean(evenement.dateFin) && premier <= fin && evenement.dateFin! >= debut
}

/** Les événements que la newsletter annonce, dans l'ordre de leur premier jour. */
export function evenementsAnnonces(
  evenements: readonly EvenementNewsletter[],
  envoi: string,
  finSemaine: string,
): EvenementNewsletter[] {
  const horizon = ajouterJours(finSemaine, JOURS_D_AVANCE_DU_RAPPEL)
  const rappelables = new Set(rendezVousARappeler(evenements, envoi).map((evenement) => evenement._id))
  return evenements.filter(
    (evenement) =>
      aLieuEntre(evenement, envoi, finSemaine) ||
      (evenement.rappel === true &&
        Boolean(evenement.dateDebut) &&
        evenement.dateDebut! <= horizon &&
        rappelables.has(evenement._id)),
  )
}

/**
 * Les soirées des événements entre deux jours, en lignes du programme. Une
 * soirée sans heure n'y entre pas : la grille se lit à l'heure. Le type de
 * l'événement (« Spectacle », « Soirée ») fait son bandeau noir.
 */
export function soireesEntre(
  evenements: readonly EvenementNewsletter[],
  debut: string,
  fin: string,
): SeanceProgramme[] {
  return evenements.flatMap((evenement) =>
    datesNotees(evenement)
      .filter((rdv) => rdv.date >= debut && rdv.date <= fin && Boolean(rdv.heure?.trim()))
      .map((rdv) => ({
        date: rdv.date,
        heure: rdv.heure!.trim(),
        salle: rdv.salle?.trim() ?? '',
        statut: null,
        filmId: null,
        titre: evenement.titre,
        slug: null,
        lien: adresseDeLEvenement(evenement.slug),
        particularite: libelleDuTypeEvenement(evenement.typeNom, evenement.ancienType) || null,
      })),
  )
}

/** Les séances des films et les soirées des événements, dans l'ordre du programme. */
export function avecLesSoirees(
  seances: readonly SeanceProgramme[],
  evenements: readonly EvenementNewsletter[],
  debut: string,
  fin: string,
): SeanceProgramme[] {
  const soirees = soireesEntre(evenements, debut, fin)
  return soirees.length ? ordonnerSeances([...seances, ...soirees]) : [...seances]
}
