/**
 * Détection des conflits de salle : deux séances dans la même salle, le même jour,
 * dont les projections se chevauchent réellement.
 *
 * ---------------------------------------------------------------------------
 * AUCUN BATTEMENT N'EST IMPOSÉ ENTRE DEUX SÉANCES.
 *
 * Une séance occupe sa salle de son heure de début jusqu'à la minute exacte où
 * le film se termine, et pas une minute de plus. Deux projections peuvent donc
 * s'enchaîner directement : un film qui finit à 20:47 en libère la salle à
 * 20:47, et la séance suivante peut commencer à 20:47.
 *
 * Le temps de nettoyage, de publicité ou d'accueil relève du métier, pas de
 * l'outil : la personne qui programme sait mieux que nous ce qu'il lui faut,
 * et l'outil ne doit pas lui refuser un enchaînement qu'elle a choisi.
 * ---------------------------------------------------------------------------
 */
import type {SeanceCandidate, SeancePlanning} from '../types'
import {formatJourCourt} from './dates'

/**
 * Durée retenue quand un film n'a pas de durée renseignée (en minutes).
 * C'est une estimation prudente, le temps que la durée soit saisie sur la
 * fiche du film — sans elle, aucun chevauchement ne pourrait être détecté.
 */
export const DUREE_PAR_DEFAUT_MIN = 120

/** Convertit « 19:30 » en minutes depuis minuit. Renvoie null si le format est invalide. */
export function heureEnMinutes(heure: string): number | null {
  const correspondance = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(heure)
  if (!correspondance) return null
  return Number(correspondance[1]) * 60 + Number(correspondance[2])
}

const MINUTES_PAR_JOUR = 24 * 60

/**
 * L'heure de fin d'une projection, telle qu'on veut l'afficher.
 *
 * Une séance de fin de soirée peut déborder sur le lendemain : « lendemain »
 * le signale, pour qu'un 23:30 + 2 h se lise « 01:30 » sans faire croire à
 * une erreur de saisie.
 */
export function heureDeFin(
  heureDebut: string,
  dureeMin: number | null,
): {heure: string; lendemain: boolean} | null {
  const debut = heureEnMinutes(heureDebut)
  if (debut === null) return null
  const fin = debut + (dureeMin ?? DUREE_PAR_DEFAUT_MIN)
  const dansLaJournee = ((fin % MINUTES_PAR_JOUR) + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR
  const heures = String(Math.floor(dansLaJournee / 60)).padStart(2, '0')
  const minutes = String(dansLaJournee % 60).padStart(2, '0')
  return {heure: `${heures}:${minutes}`, lendemain: fin >= MINUTES_PAR_JOUR}
}

/**
 * Deux projections se chevauchent-elles ?
 *
 * Chaque plage va de l'heure de début à l'heure exacte de fin du film. La
 * comparaison est strictement inférieure des deux côtés : deux séances qui se
 * touchent — l'une finit quand l'autre commence — ne se chevauchent pas.
 */
export function intervallesSeChevauchent(
  heureA: string,
  dureeA: number | null,
  heureB: string,
  dureeB: number | null,
): boolean {
  const debutA = heureEnMinutes(heureA)
  const debutB = heureEnMinutes(heureB)
  if (debutA === null || debutB === null) return false
  const finA = debutA + (dureeA ?? DUREE_PAR_DEFAUT_MIN)
  const finB = debutB + (dureeB ?? DUREE_PAR_DEFAUT_MIN)
  return debutA < finB && debutB < finA
}

interface PlageComparable {
  date: string
  salle: string
  heure: string
  duree: number | null
}

function memesSalleEtJour(a: PlageComparable, b: PlageComparable): boolean {
  return a.date === b.date && a.salle === b.salle
}

function enConflit(a: PlageComparable, b: PlageComparable): boolean {
  return memesSalleEtJour(a, b) && intervallesSeChevauchent(a.heure, a.duree, b.heure, b.duree)
}

/** Les identifiants des séances existantes qui se chevauchent entre elles (pour la grille). */
export function idsEnConflit(seances: SeancePlanning[]): Set<string> {
  const ids = new Set<string>()
  for (let i = 0; i < seances.length; i += 1) {
    for (let j = i + 1; j < seances.length; j += 1) {
      const a = {...seances[i], duree: seances[i].filmDuree}
      const b = {...seances[j], duree: seances[j].filmDuree}
      if (enConflit(a, b)) {
        ids.add(seances[i]._id)
        ids.add(seances[j]._id)
      }
    }
  }
  return ids
}

/** Résultat du tri des séances candidates avant création. */
export interface ResultatVerification {
  aCreer: SeanceCandidate[]
  doublons: number
  conflits: string[]
}

/**
 * Trie les séances candidates : celles à créer, les doublons exacts (déjà en base)
 * et celles en conflit de salle (avec les séances existantes ou entre elles).
 */
export function verifierNouvellesSeances(
  candidates: SeanceCandidate[],
  existantes: SeancePlanning[],
): ResultatVerification {
  const aCreer: SeanceCandidate[] = []
  const conflits: string[] = []
  let doublons = 0

  for (const candidate of candidates) {
    const plage = {...candidate, duree: candidate.duree}

    const estDoublon = existantes.some(
      (e) =>
        e.filmId === candidate.filmId &&
        e.date === candidate.date &&
        e.heure === candidate.heure &&
        e.salle === candidate.salle,
    )
    if (estDoublon) {
      doublons += 1
      continue
    }

    const geneExistante = existantes.find((e) => enConflit(plage, {...e, duree: e.filmDuree}))
    const geneCandidate = geneExistante
      ? undefined
      : aCreer.find((autre) => enConflit(plage, autre))
    const gene = geneExistante
      ? {titre: geneExistante.filmTitre, heure: geneExistante.heure}
      : geneCandidate

    if (gene) {
      conflits.push(
        `${formatJourCourt(candidate.date)} ${candidate.heure} · ${candidate.salle} — ` +
          `chevauche « ${gene.titre} » (${gene.heure})`,
      )
      continue
    }

    aCreer.push(candidate)
  }

  return {aCreer, doublons, conflits}
}
