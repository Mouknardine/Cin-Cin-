/**
 * Tout ce que la newsletter met en page, lu dans Sanity en une seule fois.
 *
 * RIEN N'EST SAISI DEUX FOIS.
 *
 * Le cinéma programme sa semaine dans l'onglet Planification, et remplit ses
 * fiches films comme il le fait déjà pour le site. La newsletter ne demande
 * aucune donnée supplémentaire : elle relit les mêmes documents, et les met
 * en page. C'est toute la raison d'être de ce bouton — tant qu'il fallait
 * recopier le programme à la main dans un mail, l'ancien système survivait à
 * côté de Sanity, et faisait perdre le temps que Sanity fait gagner.
 */
import type {SanityClient} from 'sanity'

import {ordonnerSeances} from '../../../salles'
import {ajouterJours, debutDeSemaine, finDeSemaine} from '../utils/dates'

/** Une séance, telle que la newsletter en a besoin. */
export interface SeanceNewsletter {
  date: string
  heure: string
  salle: string
  statut: string | null
}

/** Une séance de la grille de la semaine, avec le film qu'elle projette. */
export interface SeanceProgramme extends SeanceNewsletter {
  filmId: string | null
  titre: string
  /** L'adresse de la fiche du film sur le site, pour rendre le titre cliquable. */
  slug: string | null
}

/** Un film, avec ses séances sur la fenêtre observée. */
export interface FilmNewsletter {
  _id: string
  titre: string
  /** L'adresse de sa page sur le site : zinema.ch/film/?s=… */
  slug: string | null
  realisation: string | null
  pays: string | null
  annee: number | null
  duree: number | null
  version: string | null
  sousTitres: string | null
  age: string | null
  genres: string[] | null
  synopsis: string | null
  dateDeSortie: string | null
  statut: string | null
  bandeAnnonce: string | null
  presse: string | null
  afficheRef: string | null
  seances: SeanceNewsletter[]
}

/** Les réglages du cinéma repris dans le pied de la newsletter. */
export interface ReglagesNewsletter {
  adresse: string | null
  telephone: string | null
  telephoneBis: string | null
  email: string | null
  tarifPlein: number | null
  tarifReduit: number | null
  conditionsReduit: string[] | null
  salles: {nom: string; places: number}[] | null
  iban: string | null
}

export interface DonneesNewsletter {
  debutSemaine: string
  finSemaine: string
  /** Les séances de la semaine, dans l'ordre du programme. */
  programme: SeanceProgramme[]
  /** Les films projetés cette semaine, dans l'ordre où le programme les annonce. */
  filmsDeLaSemaine: FilmNewsletter[]
  /** Ceux qui arrivent : séances après la semaine, ou date de sortie à venir. */
  filmsAVenir: FilmNewsletter[]
  reglages: ReglagesNewsletter
}

const CHAMPS_FILM = `
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
  genres,
  synopsis,
  "dateDeSortie": releaseDate,
  "statut": status,
  "bandeAnnonce": trailerUrl,
  "presse": presseUrl,
  "afficheRef": poster.asset._ref,
  "seances": *[_type == "screening" && film._ref == ^._id
    && date >= $fenetreDebut && date <= $fenetreFin]
    | order(date asc, time asc)
    { date, "heure": time, "salle": room, "statut": status }
`

/**
 * La fenêtre observée autour de la semaine.
 *
 * En arrière, une semaine : le cinéma rappelle, pour chaque film, quand il
 * est passé la semaine précédente — ces dates-là s'écrivent en rouge, elles
 * ne sont plus rattrapables. En avant, quatre mois : de quoi annoncer les
 * sorties lointaines sans charger la requête.
 */
const SEMAINES_EN_ARRIERE = 1
const JOURS_EN_AVANT = 120

/** Le film joue-t-il au moins une fois dans la période donnée ? */
function joueEntre(film: FilmNewsletter, debut: string, fin: string): boolean {
  return film.seances.some((seance) => seance.date >= debut && seance.date <= fin)
}

/**
 * Charge la newsletter d'une semaine.
 *
 * Une seule requête : les films non retirés de l'affiche, avec leurs séances
 * sur la fenêtre, plus les réglages du cinéma. Le tri entre « cette semaine »
 * et « à venir » se fait ici, en JavaScript — il y a une dizaine de films à
 * l'affiche, et une règle lisible vaut mieux qu'une requête acrobatique.
 */
export async function chargerNewsletter(
  client: SanityClient,
  debutSemaine: string,
): Promise<DonneesNewsletter> {
  const debut = debutDeSemaine(debutSemaine)
  const fin = finDeSemaine(debut)
  const fenetreDebut = ajouterJours(debut, -7 * SEMAINES_EN_ARRIERE)
  const fenetreFin = ajouterJours(fin, JOURS_EN_AVANT)

  const reponse = await client.fetch<{
    films: FilmNewsletter[]
    reglages: Omit<ReglagesNewsletter, 'iban'> | null
    iban: string | null
  }>(
    `{
      "films": *[_type == "film" && status != "passe"]{${CHAMPS_FILM}},
      "reglages": *[_type == "siteSettings"][0]{
        "adresse": address,
        "telephone": phone,
        "telephoneBis": phoneSecondary,
        email, tarifPlein, tarifReduit, conditionsReduit,
        "salles": salles[]{nom, places}
      },
      "iban": *[_type == "abonnements"][0].iban
    }`,
    {fenetreDebut, fenetreFin},
  )

  const films = (reponse.films ?? []).map((film) => ({
    ...film,
    seances: film.seances ?? [],
  }))

  /* Le programme de la semaine, dans l'ordre du programme : les vagues de
     séances l'une après l'autre, et dans chaque vague Salle 1, Salle 2,
     Hall-Bar (voir sanity/salles.ts). Les séances annulées sortent : on
     n'annonce pas dans une newsletter une séance qui n'aura pas lieu. */
  const programme = ordonnerSeances(
    films.flatMap((film) =>
      film.seances
        .filter(
          (seance) =>
            seance.date >= debut && seance.date <= fin && seance.statut !== 'annule',
        )
        .map((seance) => ({
          ...seance,
          filmId: film._id,
          titre: film.titre,
          slug: film.slug,
        })),
    ),
  )

  /* Les films de la semaine se suivent dans l'ordre où le programme les
     annonce : celui qui ouvre la semaine ouvre la liste. Le lecteur vient de
     lire la grille, il retrouve les films dans le même ordre. */
  const ordreDApparition = new Map<string, number>()
  programme.forEach((seance, rang) => {
    if (seance.filmId && !ordreDApparition.has(seance.filmId)) {
      ordreDApparition.set(seance.filmId, rang)
    }
  })

  const filmsDeLaSemaine = films
    .filter((film) => ordreDApparition.has(film._id))
    .sort((a, b) => ordreDApparition.get(a._id)! - ordreDApparition.get(b._id)!)

  /* « À venir » : tout ce qui n'est pas à l'affiche cette semaine mais qui
     s'annonce — une séance déjà posée après la semaine, ou une date de sortie
     annoncée sans qu'aucune séance n'existe encore. */
  const apresLaSemaine = ajouterJours(fin, 1)
  const filmsAVenir = films
    .filter((film) => !ordreDApparition.has(film._id))
    .filter(
      (film) =>
        joueEntre(film, apresLaSemaine, fenetreFin) ||
        (Boolean(film.dateDeSortie) && film.dateDeSortie! > fin),
    )
    .sort((a, b) => premiereAnnonce(a, apresLaSemaine).localeCompare(premiereAnnonce(b, apresLaSemaine)))

  return {
    debutSemaine: debut,
    finSemaine: fin,
    programme,
    filmsDeLaSemaine,
    filmsAVenir,
    reglages: {...(reponse.reglages ?? videReglages()), iban: reponse.iban ?? null},
  }
}

/** La date à laquelle un film à venir se montre pour la première fois. */
function premiereAnnonce(film: FilmNewsletter, apres: string): string {
  const premiereSeance = film.seances.find((seance) => seance.date >= apres)?.date
  /* Sans séance ni date de sortie, le film ferme la liste plutôt que de
     remonter en tête par un tri sur une chaîne vide. */
  return premiereSeance ?? film.dateDeSortie ?? '9999-12-31'
}

function videReglages(): Omit<ReglagesNewsletter, 'iban'> {
  return {
    adresse: null,
    telephone: null,
    telephoneBis: null,
    email: null,
    tarifPlein: null,
    tarifReduit: null,
    conditionsReduit: null,
    salles: null,
  }
}
