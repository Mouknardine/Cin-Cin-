/* ============================================================
   La retouche finale d'une grille tirée au sort.

   Poser les films un par un, en choisissant à chaque fois le
   meilleur, ne suffit pas : à la fin il ne reste parfois qu'un seul
   film pour les dernières cases, et il retombe forcément un jour où
   il joue déjà. C'est le défaut de tout placement qui ne revient pas
   sur ses pas.

   D'où cette seconde passe : on repère les doublons, et on essaie
   d'échanger deux films de place. Un échange n'est retenu que s'il
   améliore la grille — la retouche ne peut donc jamais l'abîmer, et
   elle s'arrête d'elle-même quand plus rien ne s'améliore.
   ============================================================ */
import type {Convient, Place} from './regles-hasard'

const TOUT_CONVIENT: Convient = () => true

/** Combien coûte une répétition dans la même vague, face à une répétition le même jour. */
const COUT_MEME_VAGUE = 1_000

/**
 * Un film qui ne tient pas dans sa case — la salle est reprise avant qu'il
 * ne soit fini. C'est le pire des défauts : la retouche le règle avant tout
 * le reste.
 */
const COUT_NE_RENTRE_PAS = 100_000

/**
 * Ce qui cloche dans une grille, en un seul nombre : zéro pour une
 * grille parfaite. Les séances déjà programmées comptent, sans quoi la
 * retouche déplacerait un film juste à côté de lui-même.
 */
function coutDeLaGrille(
  places: readonly Place[],
  existantes: readonly Place[],
  convient: Convient = TOUT_CONVIENT,
): number {
  const parVague = new Map<string, number>()
  const parJour = new Map<string, number>()
  let cout = 0
  for (const place of places) {
    if (!convient(place.filmId, place)) cout += COUT_NE_RENTRE_PAS
  }
  for (const place of [...places, ...existantes]) {
    const vague = `${place.filmId}|${place.date}|${place.vague}`
    const jour = `${place.filmId}|${place.date}`
    parVague.set(vague, (parVague.get(vague) ?? 0) + 1)
    parJour.set(jour, (parJour.get(jour) ?? 0) + 1)
  }
  for (const nombre of parVague.values()) cout += COUT_MEME_VAGUE * Math.max(0, nombre - 1)
  for (const nombre of parJour.values()) cout += Math.max(0, nombre - 1)
  return cout
}

/** Nombre maximal de passes de retouche : au-delà, la grille ne bouge plus. */
const PASSES_MAX = 6

/**
 * Échange des films de place tant que la grille s'améliore.
 * La liste reçue n'est pas modifiée : une version retouchée est renvoyée.
 */
export function reparerParEchanges(
  places: readonly Place[],
  existantes: readonly Place[],
  convient: Convient = TOUT_CONVIENT,
): Place[] {
  const grille = places.map((place) => ({...place}))
  let cout = coutDeLaGrille(grille, existantes, convient)

  for (let passe = 0; passe < PASSES_MAX && cout > 0; passe += 1) {
    let ameliore = false
    for (let i = 0; i < grille.length && cout > 0; i += 1) {
      for (let j = i + 1; j < grille.length; j += 1) {
        if (grille[i].filmId === grille[j].filmId) continue
        ;[grille[i].filmId, grille[j].filmId] = [grille[j].filmId, grille[i].filmId]
        const nouveauCout = coutDeLaGrille(grille, existantes, convient)
        if (nouveauCout < cout) {
          cout = nouveauCout
          ameliore = true
        } else {
          ;[grille[i].filmId, grille[j].filmId] = [grille[j].filmId, grille[i].filmId]
        }
      }
    }
    if (!ameliore) break
  }

  return grille
}
