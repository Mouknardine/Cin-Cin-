/**
 * Manipulation de dates au format ISO « AAAA-MM-JJ », sans problème de fuseau horaire :
 * tous les calculs passent par UTC, seul « aujourdHui » lit l'heure locale.
 */

/** Jours de la semaine proposés dans les formulaires (0 = lundi). */
export const JOURS_SEMAINE = [
  {titre: 'Lundi', valeur: 0},
  {titre: 'Mardi', valeur: 1},
  {titre: 'Mercredi', valeur: 2},
  {titre: 'Jeudi', valeur: 3},
  {titre: 'Vendredi', valeur: 4},
  {titre: 'Samedi', valeur: 5},
  {titre: 'Dimanche', valeur: 6},
] as const

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

/** Le lundi de la semaine contenant la date donnée. */
export function lundiDeLaSemaine(dateISO: string): string {
  const indexDepuisLundi = (enDateUTC(dateISO).getUTCDay() + 6) % 7
  return ajouterJours(dateISO, -indexDepuisLundi)
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

/** Ex. « Semaine du 14 au 20 juillet 2026 » (ou « du 30 juin au 6 juillet » à cheval sur deux mois). */
export function formatPeriodeSemaine(lundiISO: string): string {
  const dimancheISO = ajouterJours(lundiISO, 6)
  const memeMois = lundiISO.slice(0, 7) === dimancheISO.slice(0, 7)
  const debut = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    ...(memeMois ? {} : {month: 'long'}),
    timeZone: 'UTC',
  }).format(enDateUTC(lundiISO))
  const fin = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(enDateUTC(dimancheISO))
  return `Semaine du ${debut} au ${fin}`
}
