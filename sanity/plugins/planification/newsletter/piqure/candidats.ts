/**
 * La piqûre de rappel : ce qu'on peut mettre en avant, lu dans Sanity.
 *
 * Demande du cinéma (18 novembre 2026) : « la piqûre de rappel est une
 * newsletter qu'on envoie en cours de semaine en plus de la newsletter du
 * lundi, et qui a pour but de mettre en avant un film ou un événement :
 * comme les deux films japonais de vendredi (en présence du réalisateur), ou
 * bientôt notre Marché de Noël ».
 *
 * Le cinéma coche ce qu'il veut mettre en avant ; rien n'est ressaisi. On
 * lui propose, à partir du jour de l'envoi et pour les huit semaines qui
 * suivent :
 *   - chaque film qui a au moins une séance (annulées exclues) ;
 *   - chaque événement qui a lieu (une soirée notée, son jour, ou sa période).
 *
 * UN FILM MONTRE SES SÉANCES DES SEPT JOURS QUI VIENNENT.
 *
 * La piqûre part en milieu de semaine : l'abonné veut savoir quand il peut
 * encore y aller. Les pastilles reprennent donc les séances des sept jours
 * qui suivent l'envoi. Un film qui ne passe qu'après — une avant-première
 * dans quinze jours — montre les sept jours qui suivent sa première séance.
 * Ses séances spéciales, elles, sont rappelées en bandeau sur toute la
 * période : c'est souvent pour elles qu'on envoie la piqûre.
 *
 * Ce fichier ne fait que trier : il se vérifie hors du Studio
 * (verifications/piqure.mjs).
 */
import type {SanityClient} from 'sanity'

import {ajouterJours} from '../../utils/dates'
import {REQUETE_EVENEMENTS, aLieuEntre, uneVersionParEvenement} from '../evenements'
import {CHAMPS_FILM, REQUETE_REGLAGES, filmsLus, reglagesDuCinema, type ReglagesLus} from '../lecture'
import {prochainesDates, type EvenementNewsletter} from '../rendez-vous'
import type {FilmNewsletter, ReglagesNewsletter, SeanceNewsletter} from '../types'

/** Ce qu'on propose : huit semaines à partir de l'envoi, de quoi annoncer un Marché de Noël. */
export const HORIZON_JOURS = 56
/** Les pastilles d'un film couvrent sept jours : une semaine de séances. */
export const JOURS_DE_PASTILLES = 7

export interface FilmEnAvant {
  genre: 'film'
  /** Ce qui l'identifie dans la sélection, d'un rechargement à l'autre. */
  cle: string
  /** Le jour de sa prochaine séance : c'est lui qui range la liste. */
  date: string
  film: FilmNewsletter
  /** Ses séances non annulées, de l'envoi à l'horizon. */
  seances: SeanceNewsletter[]
  /** Celles qui prennent une pastille : sept jours de séances. */
  pastilles: SeanceNewsletter[]
}

export interface EvenementEnAvant {
  genre: 'evenement'
  cle: string
  /** Sa prochaine soirée, son premier jour, ou le jour de l'envoi s'il a déjà commencé. */
  date: string
  evenement: EvenementNewsletter
}

export type MiseEnAvant = FilmEnAvant | EvenementEnAvant

export interface DonneesPiqure {
  envoi: string
  films: FilmEnAvant[]
  evenements: EvenementEnAvant[]
  reglages: ReglagesNewsletter
}

/** Le dernier jour proposé. */
export function finDeLHorizon(envoi: string): string {
  return ajouterJours(envoi, HORIZON_JOURS - 1)
}

/**
 * Le jour de l'envoi proposé à l'ouverture : aujourd'hui, ou le mercredi de
 * la semaine affichée si on prépare déjà une semaine à venir.
 */
export function envoiParDefaut(debutSemaine: string, aujourdhui: string): string {
  return debutSemaine > aujourdhui ? debutSemaine : aujourdhui
}

function parDateEtHeure(a: SeanceNewsletter, b: SeanceNewsletter): number {
  return a.date.localeCompare(b.date) || String(a.heure ?? '').localeCompare(String(b.heure ?? ''))
}

/** Le film tel que la piqûre le propose, ou null s'il ne passe pas d'ici l'horizon. */
export function filmEnAvant(film: FilmNewsletter, envoi: string): FilmEnAvant | null {
  const horizon = finDeLHorizon(envoi)
  const seances = film.seances
    .filter((seance) => seance.statut !== 'annule' && seance.date >= envoi && seance.date <= horizon)
    .sort(parDateEtHeure)
  const prochaine = seances[0]
  if (!prochaine) return null

  const septiemeJour = ajouterJours(envoi, JOURS_DE_PASTILLES - 1)
  const ouverture = prochaine.date > septiemeJour ? prochaine.date : envoi
  const fermeture = ajouterJours(ouverture, JOURS_DE_PASTILLES - 1)
  return {
    genre: 'film',
    cle: `film:${film._id}`,
    date: prochaine.date,
    film,
    seances,
    pastilles: seances.filter((seance) => seance.date <= fermeture),
  }
}

/** L'événement tel que la piqûre le propose, ou null s'il n'a pas lieu d'ici l'horizon. */
export function evenementEnAvant(evenement: EvenementNewsletter, envoi: string): EvenementEnAvant | null {
  if (!aLieuEntre(evenement, envoi, finDeLHorizon(envoi))) return null
  const prochaineSoiree = prochainesDates(evenement, envoi)[0]?.date
  const premierJour = evenement.dateDebut && evenement.dateDebut > envoi ? evenement.dateDebut : envoi
  return {
    genre: 'evenement',
    /* Sans le préfixe du brouillon : l'événement reste coché quand on le publie. */
    cle: `evenement:${evenement._id.replace(/^drafts\./, '')}`,
    date: prochaineSoiree ?? premierJour,
    evenement,
  }
}

/** Le nom de ce qu'on met en avant : le titre du film ou de l'événement. */
export function titreDe(miseEnAvant: MiseEnAvant): string {
  return miseEnAvant.genre === 'film' ? miseEnAvant.film.titre : miseEnAvant.evenement.titre
}

/** Le plus proche d'abord ; à égalité, par ordre alphabétique. */
export function dansLOrdre<T extends MiseEnAvant>(liste: readonly T[]): T[] {
  return [...liste].sort((a, b) => a.date.localeCompare(b.date) || titreDe(a).localeCompare(titreDe(b), 'fr'))
}

function sansVide<T>(valeur: T | null): valeur is T {
  return valeur !== null
}

/** Tout ce que la piqûre peut mettre en avant, à partir du jour de l'envoi. */
export async function chargerPiqure(client: Pick<SanityClient, 'fetch'>, envoi: string): Promise<DonneesPiqure> {
  const horizon = finDeLHorizon(envoi)
  /* Les films ne sont pas filtrés par statut : une reprise ou un ciné-club
     sur un film retiré de l'affiche se met en avant comme le reste. Le
     brouillon d'un film n'a pas de séance — elles visent la version
     publiée —, il n'est donc pas lu. */
  const reponse = await client.fetch<{
    films: FilmNewsletter[] | null
    evenements: EvenementNewsletter[] | null
    reglages: ReglagesLus | null
  }>(
    `{
      "films": *[_type == "film" && !(_id in path("drafts.**"))]{${CHAMPS_FILM}},
      "evenements": ${REQUETE_EVENEMENTS},
      "reglages": ${REQUETE_REGLAGES}
    }`,
    {fenetreDebut: envoi, fenetreFin: horizon, envoi, horizon},
  )

  return {
    envoi,
    films: dansLOrdre(filmsLus(reponse.films).map((film) => filmEnAvant(film, envoi)).filter(sansVide)),
    evenements: dansLOrdre(
      uneVersionParEvenement(reponse.evenements ?? [])
        .map((evenement) => evenementEnAvant(evenement, envoi))
        .filter(sansVide),
    ),
    reglages: reglagesDuCinema(reponse.reglages),
  }
}
