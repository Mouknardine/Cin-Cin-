/**
 * Ce que les newsletters demandent à Sanity, et la remise en ordre de ce
 * qui revient : les mêmes champs de film et les mêmes réglages pour la
 * newsletter du lundi et pour la piqûre de rappel.
 */
import type {FilmNewsletter, ReglagesNewsletter, SeanceNewsletter} from './types'

/**
 * Les champs d'un film, avec ses séances entre $fenetreDebut et $fenetreFin.
 * À placer entre accolades après un filtre de films.
 */
export const CHAMPS_FILM = `
  _id,
  "titre": title,
  "slug": coalesce(slug.current, _id),
  "realisation": director,
  "pays": country,
  "annee": year,
  "duree": duration,
  "version": language,
  "sousTitres": subtitles,
  "age": ageRating,
  typeDeFilm,
  genres,
  synopsis,
  "dateDeSortie": releaseDate,
  "premiereProjection": *[_type == "screening" && film._ref == ^._id && status != "annule"]
    | order(date asc)[0].date,
  "statut": status,
  "bandeAnnonce": trailerUrl,
  "presse": presseUrl,
  "afficheRef": poster.asset._ref,
  presence,
  presenceDate,
  "seances": *[_type == "screening" && film._ref == ^._id
    && date >= $fenetreDebut && date <= $fenetreFin]
    | order(date asc, time asc)
    { _id, date, "heure": time, "salle": room, "statut": status,
      "projection": evenementDuFilm, "mention": versionNote }
`

/** Les réglages du cinéma et l'IBAN des abonnements, pour le pied du message. */
export const REQUETE_REGLAGES = `{
  "lus": *[_type == "siteSettings"][0]{
    "adresse": address,
    "telephone": phone,
    "telephoneBis": phoneSecondary,
    email, tarifPlein, tarifReduit, conditionsReduit,
    "salles": salles[]{nom, places}
  },
  "iban": *[_type == "abonnements"][0].iban
}`

/** La forme de ce que REQUETE_REGLAGES renvoie. */
export interface ReglagesLus {
  lus: Omit<ReglagesNewsletter, 'iban'> | null
  iban: string | null
}

const SANS_REGLAGES: Omit<ReglagesNewsletter, 'iban'> = {
  adresse: null,
  telephone: null,
  telephoneBis: null,
  email: null,
  tarifPlein: null,
  tarifReduit: null,
  conditionsReduit: null,
  salles: null,
}

/** Les réglages prêts à l'emploi, même si le document des réglages manque. */
export function reglagesDuCinema(reponse: ReglagesLus | null | undefined): ReglagesNewsletter {
  return {...(reponse?.lus ?? SANS_REGLAGES), iban: reponse?.iban ?? null}
}

/**
 * Une séance en cours d'édition existe en deux exemplaires dans le Studio :
 * la version publiée et son brouillon. La newsletter n'en garde qu'une, le
 * brouillon — c'est ce que le cinéma vient d'écrire —, sans quoi la même
 * séance s'annoncerait deux fois. La grille du planning fait de même
 * (utils/mutations.ts).
 */
function uneVersionParSeance(seances: readonly SeanceNewsletter[]): SeanceNewsletter[] {
  const idPublie = (id: string): string => id.replace(/^drafts\./, '')
  const brouillons = new Set(
    seances.flatMap((seance) => (seance._id?.startsWith('drafts.') ? [idPublie(seance._id)] : [])),
  )
  return seances.filter((seance) => !seance._id || seance._id.startsWith('drafts.') || !brouillons.has(seance._id))
}

/** Les films tels que Sanity les renvoie, avec une liste de séances toujours présente et sans doublon. */
export function filmsLus(films: readonly FilmNewsletter[] | null | undefined): FilmNewsletter[] {
  return (films ?? []).map((film) => ({...film, seances: uneVersionParSeance(film.seances ?? [])}))
}
