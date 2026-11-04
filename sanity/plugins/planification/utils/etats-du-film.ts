/* ============================================================
   Où en est ce film ? — plusieurs cases à la fois.

   Demande du cinéma (3 novembre 2026) : « il faut pouvoir cocher
   deux options — première, prochainement et à l'affiche ; la seule
   qui ne peut pas avoir d'autre coche, c'est Terminé ».

   Les règles des cases :
     - « Terminé » est seul : le cocher décoche le reste, cocher autre
       chose le décoche ;
     - avant-première, première et projection extraordinaire
       s'excluent entre elles : la fiche n'a qu'un jour et qu'une heure
       de projection ;
     - tout le reste se combine.

   Le film apparaît dans CHAQUE rubrique cochée de la page Films. Et,
   jour après jour, le site range de lui-même (statutsDuJour) :
     - « Prochainement » devient « À l'affiche » le jour de la sortie ;
     - une avant-première, une première ou une projection
       extraordinaire quitte sa rubrique le lendemain de la projection,
       si une autre case est cochée — le film reste alors dans
       celle-ci. Seule cochée, elle reste où elle est, comme avant.

   Deux champs sont enregistrés : « statuts », la liste des cases, et
   « status », l'état principal, tenu à jour en même temps. C'est lui
   que lisent les requêtes qui n'ont besoin que d'un état (la séance de
   l'avant-première, les films terminés).

   Le même calcul existe pour le site, dans assets/js/data.js
   (etatDuJour) : verifications/seances-speciales.mjs vérifie qu'ils
   disent la même chose.
   ============================================================ */
import {estUneProjection, STATUTS_A_PROJECTION} from './projection-de-la-fiche'

export const TERMINE = 'passe'

/** Les cases, dans l'ordre du formulaire. */
export const ETATS_DU_FILM = [
  {valeur: 'a-laffiche', titre: "À l'affiche", aide: 'visible en premier sur le site'},
  {valeur: 'avant-premiere', titre: 'Avant-première', aide: 'projection avant la sortie du film'},
  {valeur: 'premiere', titre: 'Première', aide: 'la projection qui lance le film'},
  {valeur: 'projection-extraordinaire', titre: 'Projection extraordinaire', aide: "un film qu'on passe une seule fois"},
  {valeur: 'prochainement', titre: 'Prochainement', aide: 'pas encore de séance'},
  {valeur: 'cycle', titre: 'Cycle / ciné-club', aide: ''},
  {valeur: TERMINE, titre: 'Terminé', aide: "retiré de l'affiche — ne se combine avec rien"},
] as const

/** L'ordre de priorité de l'état principal : la projection datée d'abord, c'est elle qu'on annonce. */
const PRIORITE = [
  TERMINE,
  ...STATUTS_A_PROJECTION,
  'a-laffiche',
  'prochainement',
  'cycle',
]

function rang(statut: string): number {
  const position = PRIORITE.indexOf(statut)
  return position === -1 ? PRIORITE.length : position
}

/** Les cases cochées d'une fiche ; une fiche d'avant le 3 novembre 2026 n'a que « status ». */
export function statutsDe(fiche: {status?: unknown; statuts?: unknown} | null | undefined): string[] {
  const liste = Array.isArray(fiche?.statuts)
    ? fiche.statuts.filter((s): s is string => typeof s === 'string' && s !== '')
    : []
  if (liste.length) return [...new Set(liste)]
  return typeof fiche?.status === 'string' && fiche.status ? [fiche.status] : []
}

/** L'état principal d'une liste de cases. */
export function statutPrincipal(statuts: readonly string[]): string | null {
  return [...statuts].sort((a, b) => rang(a) - rang(b))[0] ?? null
}

/** Coche ou décoche une case, en appliquant les règles d'exclusion. */
export function basculer(statuts: readonly string[], valeur: string): string[] {
  if (statuts.includes(valeur)) return statuts.filter((s) => s !== valeur)
  if (valeur === TERMINE) return [TERMINE]
  const restants = statuts.filter(
    (s) => s !== TERMINE && !(estUneProjection(valeur) && estUneProjection(s)),
  )
  return [...restants, valeur].sort((a, b) => ordreDuFormulaire(a) - ordreDuFormulaire(b))
}

function ordreDuFormulaire(statut: string): number {
  return ETATS_DU_FILM.findIndex((etat) => etat.valeur === statut)
}

/** Ce que la fiche dit, pour le calcul du jour. */
export interface FicheDuJour {
  status?: string | null
  statuts?: string[] | null
  releaseDate?: string | null
  projectionDate?: string | null
}

/** Les rubriques où le film se range ce jour-là. */
export function statutsDuJour(fiche: FicheDuJour, aujourdhui: string): string[] {
  let statuts = statutsDe(fiche)
  if (statuts.includes(TERMINE)) return [TERMINE]
  const sorti = Boolean(fiche.releaseDate && fiche.releaseDate <= aujourdhui)
  statuts = [...new Set(statuts.map((s) => (s === 'prochainement' && sorti ? 'a-laffiche' : s)))]
  const projectionPassee = Boolean(fiche.projectionDate && fiche.projectionDate < aujourdhui)
  const autres = statuts.filter((s) => !estUneProjection(s))
  return projectionPassee && autres.length ? autres : statuts
}

/** L'état principal du film ce jour-là : celui que le site écrit sur sa carte. */
export function statutPrincipalDuJour(fiche: FicheDuJour, aujourdhui: string): string | null {
  return statutPrincipal(statutsDuJour(fiche, aujourdhui))
}

/**
 * Une case est-elle cochée ? En GROQ, pour les filtres du Studio :
 * les fiches d'avant le 3 novembre 2026 n'ont que « status ».
 */
export function groqCoche(statut: string): string {
  return `${JSON.stringify(statut)} in coalesce(statuts, [status])`
}
