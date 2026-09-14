/**
 * L'adresse publique d'une image déposée dans Sanity.
 *
 * La newsletter part par e-mail : ses affiches ne peuvent pas venir du
 * Studio, elles doivent avoir une adresse que n'importe quelle messagerie
 * saura aller chercher. Les images de Sanity en ont une, publique et
 * permanente — c'est celle-là qu'on écrit dans le gabarit.
 *
 * Sanity nomme ses images ainsi :
 *   image-3f8a…c1-800x1200-jpg
 *          ^identifiant  ^dimensions ^format
 * et les sert à cette adresse :
 *   https://cdn.sanity.io/images/<projet>/<jeu de données>/3f8a…c1-800x1200.jpg
 */

/** Motif d'un identifiant d'image Sanity. Tout le reste est ignoré. */
const REFERENCE_IMAGE = /^image-([A-Za-z0-9]+)-(\d+x\d+)-(\w+)$/

export interface OptionsImage {
  projectId: string
  dataset: string
  /** Largeur demandée, en pixels. L'image n'est jamais agrandie. */
  largeur: number
}

/**
 * Renvoie l'adresse de l'image, ou null si la référence est absente ou
 * illisible — au gabarit de décider quoi mettre à la place.
 */
export function urlImage(
  reference: string | undefined | null,
  {projectId, dataset, largeur}: OptionsImage,
): string | null {
  const lue = REFERENCE_IMAGE.exec(String(reference ?? ''))
  if (!lue) return null
  const [, identifiant, dimensions, format] = lue
  /* « fit=max » : l'image est réduite si elle est plus large, jamais
     étirée si elle est plus étroite — une affiche basse définition vaut
     mieux floue que crénelée. */
  return (
    `https://cdn.sanity.io/images/${projectId}/${dataset}/` +
    `${identifiant}-${dimensions}.${format}?w=${largeur}&fit=max`
  )
}
