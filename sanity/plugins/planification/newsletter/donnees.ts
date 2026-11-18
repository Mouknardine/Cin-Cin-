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
import {JOURS_D_AVANCE_DU_RAPPEL, REQUETE_EVENEMENTS, avecLesSoirees, evenementsAnnonces, uneVersionParEvenement} from './evenements'
import {CHAMPS_FILM, REQUETE_REGLAGES, filmsLus, reglagesDuCinema, type ReglagesLus} from './lecture'
import {particulariteDeLaSeance, texteParticularite} from './particularite'
import type {EvenementNewsletter} from './rendez-vous'
import {jourDeLEnvoi} from './seances'
import type {DonneesNewsletter, FilmNewsletter, SeanceNewsletter, SeanceProgramme} from './types'

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

/** « Avant-première · En présence de … » pour cette séance de ce film, ou null. */
export function particulariteDe(seance: SeanceNewsletter, film: FilmNewsletter): string | null {
  return texteParticularite(particulariteDeLaSeance(seance, film))
}

/**
 * Les séances de tous les films entre deux dates, dans l'ordre du programme :
 * les vagues de séances l'une après l'autre, et dans chaque vague Salle 1,
 * Salle 2, Hall-Bar (voir sanity/salles.ts). Les séances annulées sortent :
 * on n'annonce pas dans une newsletter une séance qui n'aura pas lieu.
 */
export function programmeEntre(films: FilmNewsletter[], debut: string, fin: string): SeanceProgramme[] {
  return ordonnerSeances(
    films.flatMap((film) =>
      film.seances
        .filter((seance) => seance.date >= debut && seance.date <= fin && seance.statut !== 'annule')
        .map((seance) => ({
          ...seance,
          filmId: film._id,
          titre: film.titre,
          slug: film.slug,
          particularite: particulariteDe(seance, film),
        })),
    ),
  )
}

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
    films: FilmNewsletter[] | null
    evenements: EvenementNewsletter[] | null
    reglages: ReglagesLus | null
  }>(
    `{
      "films": *[_type == "film" && status != "passe"]{${CHAMPS_FILM}},
      "evenements": ${REQUETE_EVENEMENTS},
      "reglages": ${REQUETE_REGLAGES}
    }`,
    {fenetreDebut, fenetreFin, envoi: jourDeLEnvoi(debut), horizon: ajouterJours(fin, JOURS_D_AVANCE_DU_RAPPEL)},
  )

  const films = filmsLus(reponse.films)

  /* Les soirées des événements prennent leur ligne dans le programme de leur
     jour, entre les séances (demande du cinéma, 4 novembre 2026). */
  const evenements = uneVersionParEvenement(reponse.evenements ?? [])
  const programme = avecLesSoirees(programmeEntre(films, debut, fin), evenements, debut, fin)

  /* La newsletter part le lundi, mais la semaine qu'elle annonce n'ouvre que
     le mercredi : le soir même et le lendemain restaient sans programme. Le
     cinéma les a fait remettre en tête, en grisé (5 octobre 2026). Ils ne
     comptent pas parmi les films de la semaine : seulement dans la grille. */
  const envoi = jourDeLEnvoi(debut)
  const veille = ajouterJours(debut, -1)
  const lundiEtMardi = avecLesSoirees(programmeEntre(films, envoi, veille), evenements, envoi, veille)

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
    lundiEtMardi,
    filmsDeLaSemaine,
    filmsAVenir,
    rendezVous: evenementsAnnonces(evenements, envoi, fin),
    reglages: reglagesDuCinema(reponse.reglages),
  }
}

/** La date à laquelle un film à venir se montre pour la première fois. */
function premiereAnnonce(film: FilmNewsletter, apres: string): string {
  const premiereSeance = film.seances.find((seance) => seance.date >= apres)?.date
  /* Sans séance ni date de sortie, le film ferme la liste plutôt que de
     remonter en tête par un tri sur une chaîne vide. */
  return premiereSeance ?? film.dateDeSortie ?? '9999-12-31'
}
