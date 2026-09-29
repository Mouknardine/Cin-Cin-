/* ============================================================
   Revenir en arrière : la photo d'une période, et sa remise en place.

   Avant chaque geste de la planification — déplacer, échanger, changer
   un film, créer, dupliquer, remplir, supprimer, vider — l'outil prend
   une PHOTO des séances de la période touchée : les documents entiers,
   version publiée et brouillon. « Annuler » remet la période exactement
   dans cet état : les séances créées depuis disparaissent, les
   supprimées reviennent avec leur identité d'origine (les billets qui
   les désignent les retrouvent), les modifiées reprennent leurs champs.

   Un seul mécanisme pour tous les gestes, plutôt qu'un « contraire »
   écrit pour chacun : un geste ajouté demain sera annulable du simple
   fait de prendre sa photo.
   ============================================================ */
import type {SanityClient, SanityDocument} from 'sanity'

import {debutDeSemaine, finDeSemaine} from './dates'

/** Une période de dates, bornes comprises. */
export interface Periode {
  debut: string
  fin: string
}

/**
 * Les semaines entières qui couvrent ces dates. Un geste retouche toute
 * sa semaine — les séances suivantes se recalent derrière lui — : c'est
 * donc la semaine entière qu'on photographie.
 */
export function semainesDe(...dates: string[]): Periode {
  const triees = [...dates].sort()
  const premiere = triees[0] ?? ''
  const derniere = triees[triees.length - 1] ?? premiere
  return {debut: debutDeSemaine(premiere), fin: finDeSemaine(debutDeSemaine(derniere))}
}

/** L'état d'une période à un instant donné. */
export interface Photo {
  /** Ce qu'on annulerait : « Vider la semaine », « Déplacer une séance »… */
  geste: string
  periode: Periode
  documents: SanityDocument[]
}

/** Ce que Sanity gère seul, et qu'on ne peut pas réécrire. */
const CHAMPS_SYSTEME = ['_rev', '_createdAt', '_updatedAt'] as const

/* La photo doit voir les brouillons comme les versions publiées : une
   remise en place qui oublierait un brouillon laisserait la grille
   afficher l'état d'après. */
function lecteurComplet(client: SanityClient): SanityClient {
  return client.withConfig({perspective: 'raw'})
}

const REQUETE_PERIODE = `*[_type == "screening" && defined(date) && date >= $debut && date <= $fin]`

/** Photographie toutes les séances d'une période. */
export async function photographier(
  client: SanityClient,
  geste: string,
  periode: Periode,
): Promise<Photo> {
  const documents = await lecteurComplet(client).fetch<SanityDocument[]>(REQUETE_PERIODE, {...periode})
  return {geste, periode, documents: documents ?? []}
}

function sansChampsSysteme(document: SanityDocument): SanityDocument {
  const copie: Record<string, unknown> = {...document}
  for (const champ of CHAMPS_SYSTEME) delete copie[champ]
  return copie as SanityDocument
}

/**
 * Remet une période dans l'état de sa photo, en une seule transaction :
 * tout revient, ou rien ne bouge.
 */
export async function restaurer(client: SanityClient, photo: Photo): Promise<void> {
  const actuels = await lecteurComplet(client).fetch<string[]>(`${REQUETE_PERIODE}._id`, {
    ...photo.periode,
  })
  const photographies = new Set(photo.documents.map((document) => document._id))

  const transaction = client.transaction()
  for (const id of actuels ?? []) {
    if (!photographies.has(id)) transaction.delete(id)
  }
  for (const document of photo.documents) {
    transaction.createOrReplace(sansChampsSysteme(document))
  }
  await transaction.commit()
}
