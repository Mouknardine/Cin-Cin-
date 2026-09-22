/* ============================================================
   Les couleurs du planning : une par film, une par semaine.

   UNE COULEUR PAR FILM. D'un coup d'œil, on voit où passe chaque film
   dans la semaine. Les couleurs sont distribuées aux seuls films de la
   semaine affichée (films-de-la-semaine.ts), dans l'ordre du compteur :
   jusqu'à douze films, deux films n'ont jamais la même teinte.

   La palette est faite de douze teintes franchement différentes,
   rangées pour que deux films voisins dans la liste ne reçoivent
   jamais deux teintes proches. (L'ancienne palette
   mettait trois bleus et deux rouges dans la même semaine.)

   UNE COULEUR PAR SEMAINE. En passant d'une semaine à l'autre, la
   pastille change de teinte : impossible de croire qu'on travaille
   sur la semaine prochaine quand on est revenu sur celle-ci.
   ============================================================ */

/* Les neuf premières sont les plus éloignées les unes des autres : une
   semaine ordinaire compte rarement plus de neuf films. Les trois
   dernières ne servent qu'au-delà, et restent distinctes de leurs
   voisines dans la liste. */
const COULEURS_FILMS = [
  '#E6194B', // rouge
  '#3CB44B', // vert
  '#4363D8', // bleu
  '#F58231', // orange
  '#911EB4', // violet
  '#1FB5D6', // cyan
  '#E6B800', // jaune
  '#9A6324', // brun
  '#4A4A4A', // graphite
  '#E829C8', // rose
  '#8DB600', // olive
  '#008080', // sarcelle
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

/** Un nombre stable tiré d'un identifiant, pour un film hors de la liste. */
function empreinte(texte: string): number {
  let valeur = 0
  for (const caractere of texte) valeur = (valeur * 31 + caractere.charCodeAt(0)) >>> 0
  return valeur
}

/**
 * La couleur de chaque film, selon sa place parmi les films de la
 * semaine. Un film absent de la liste reçoit une teinte tirée de son
 * identifiant, pour ne jamais rester sans couleur.
 */
export function couleursDesFilms(filmIdsDeLaSemaine: readonly string[]): (filmId: string) => string {
  const index = new Map(filmIdsDeLaSemaine.map((filmId, position) => [filmId, position]))
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
