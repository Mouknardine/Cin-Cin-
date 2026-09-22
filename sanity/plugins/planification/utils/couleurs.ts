/* ============================================================
   Les couleurs du planning : une par film, une par semaine.

   UNE COULEUR PAR FILM. D'un coup d'œil, on voit où passe chaque film
   dans la semaine, et s'il revient trop souvent le même jour. La
   couleur d'un film suit sa place dans la liste des films à
   l'affiche (triée par titre) : elle reste la même d'une semaine à
   l'autre tant que l'affiche ne change pas, et deux films à
   l'affiche n'ont jamais la même tant qu'ils sont douze au plus.

   UNE COULEUR PAR SEMAINE. En passant d'une semaine à l'autre, le
   bandeau change de teinte : impossible de croire qu'on travaille
   sur la semaine prochaine quand on est revenu sur celle-ci.

   Des teintes moyennes, lisibles sur le Studio clair comme sombre.
   ============================================================ */
import type {FilmPlanning} from '../types'

const COULEURS_FILMS = [
  '#E4572E',
  '#2E86AB',
  '#3BB273',
  '#F2A541',
  '#7B6CF6',
  '#D7263D',
  '#1B998B',
  '#C17817',
  '#A23B72',
  '#5C80BC',
  '#8AB17D',
  '#E07A5F',
] as const

const COULEURS_SEMAINES = [
  '#2E86AB',
  '#3BB273',
  '#E4572E',
  '#7B6CF6',
  '#F2A541',
  '#A23B72',
] as const

const JOUR_MS = 24 * 60 * 60 * 1000

/** Un nombre stable tiré d'un identifiant, pour les films hors de la liste. */
function empreinte(texte: string): number {
  let valeur = 0
  for (const caractere of texte) valeur = (valeur * 31 + caractere.charCodeAt(0)) >>> 0
  return valeur
}

/**
 * La couleur de chaque film. Les films à l'affiche d'abord, dans l'ordre
 * de la liste ; les autres (terminés, supprimés) reçoivent une couleur
 * tirée de leur identifiant.
 */
export function couleursDesFilms(films: readonly FilmPlanning[]): (filmId: string) => string {
  const actifs = films.filter((film) => film.statut !== 'passe')
  const index = new Map(actifs.map((film, position) => [film._id, position]))
  return (filmId: string) => {
    const position = index.get(filmId) ?? empreinte(filmId)
    return COULEURS_FILMS[position % COULEURS_FILMS.length]
  }
}

/** La couleur de la semaine qui s'ouvre ce mercredi-là (AAAA-MM-JJ). */
export function couleurDeLaSemaine(debutSemaine: string): string {
  const [annee, mois, jour] = debutSemaine.split('-').map(Number)
  const numero = Math.floor(Date.UTC(annee, mois - 1, jour) / (7 * JOUR_MS))
  return COULEURS_SEMAINES[
    ((numero % COULEURS_SEMAINES.length) + COULEURS_SEMAINES.length) % COULEURS_SEMAINES.length
  ]
}
