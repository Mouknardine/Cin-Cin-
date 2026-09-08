/**
 * Manipulation de dates au format ISO « AAAA-MM-JJ », sans problème de fuseau horaire :
 * tous les calculs passent par UTC, seul « aujourdHui » lit l'heure locale.
 *
 * ---------------------------------------------------------------------------
 * LA SEMAINE DE CINÉMA VA DU MERCREDI AU MARDI.
 *
 * C'est le rythme du métier : les nouveaux films sortent le mercredi, et la
 * programmation d'une semaine se pense d'un mercredi au mardi suivant. Tout
 * l'outil suit cette convention — la grille, les périodes affichées, l'ordre
 * des jours proposés et la duplication d'une semaine sur l'autre.
 * ---------------------------------------------------------------------------
 */

/**
 * Les jours proposés dans les formulaires, dans l'ordre de la semaine de cinéma.
 *
 * La valeur n'est pas le jour au sens du calendrier : c'est le NOMBRE DE JOURS
 * depuis le mercredi d'ouverture. Mercredi vaut donc 0, et mardi 6.
 */
export const JOURS_SEMAINE = [
  {titre: 'Mercredi', valeur: 0},
  {titre: 'Jeudi', valeur: 1},
  {titre: 'Vendredi', valeur: 2},
  {titre: 'Samedi', valeur: 3},
  {titre: 'Dimanche', valeur: 4},
  {titre: 'Lundi', valeur: 5},
  {titre: 'Mardi', valeur: 6},
] as const

/** Jours entre le mercredi et la fin de la semaine de cinéma (le mardi). */
export const DUREE_SEMAINE_JOURS = 7

function enDateUTC(dateISO: string): Date {
  const [annee, mois, jour] = dateISO.split('-').map(Number)
  return new Date(Date.UTC(annee, mois - 1, jour))
}

function enISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** La date du jour, au format ISO, dans le fuseau local de l'utilisateur. */
export function aujourdHui(): string {
  const maintenant = new Date()
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0')
  const jour = String(maintenant.getDate()).padStart(2, '0')
  return `${maintenant.getFullYear()}-${mois}-${jour}`
}

/** Ajoute (ou retire) un nombre de jours à une date ISO. */
export function ajouterJours(dateISO: string, nbJours: number): string {
  const date = enDateUTC(dateISO)
  date.setUTCDate(date.getUTCDate() + nbJours)
  return enISO(date)
}

/**
 * Le mercredi qui ouvre la semaine de cinéma contenant la date donnée.
 * Un mardi appartient donc à la semaine ouverte six jours plus tôt.
 */
export function debutDeSemaine(dateISO: string): string {
  const MERCREDI = 3 // getUTCDay() : 0 = dimanche
  const joursDepuisMercredi = (enDateUTC(dateISO).getUTCDay() - MERCREDI + 7) % 7
  return ajouterJours(dateISO, -joursDepuisMercredi)
}

/** Le mardi qui referme la semaine ouverte ce mercredi-là. */
export function finDeSemaine(debutISO: string): string {
  return ajouterJours(debutISO, DUREE_SEMAINE_JOURS - 1)
}

/** Ex. « mer. 16 juil. » */
export function formatJourCourt(dateISO: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(enDateUTC(dateISO))
}

/** Ex. « Semaine du 16 au 22 juillet 2026 » (ou « du 30 juin au 6 juillet » à cheval sur deux mois). */
export function formatPeriodeSemaine(debutISO: string): string {
  const finISO = finDeSemaine(debutISO)
  const memeMois = debutISO.slice(0, 7) === finISO.slice(0, 7)
  const debut = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    ...(memeMois ? {} : {month: 'long'}),
    timeZone: 'UTC',
  }).format(enDateUTC(debutISO))
  const fin = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(enDateUTC(finISO))
  return `Semaine du ${debut} au ${fin}`
}
