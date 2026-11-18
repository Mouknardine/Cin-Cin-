/**
 * Ce que les newsletters mettent en page : les séances, les films et les
 * réglages du cinéma, tels que Sanity les renvoie.
 *
 * Les deux envois s'en servent — la newsletter du lundi (donnees.ts) et la
 * piqûre de rappel du milieu de semaine (piqure/candidats.ts).
 */
import type {EvenementNewsletter} from './rendez-vous'

/** Une séance, telle que la newsletter en a besoin. */
export interface SeanceNewsletter {
  /** Son identifiant Sanity : sert à ne pas compter deux fois une séance en cours d'édition. */
  _id?: string
  date: string
  heure: string
  salle: string
  statut: string | null
  /** La marque d'une avant-première, d'une première ou d'une projection
      extraordinaire, posée par la fiche du film ; sinon null. */
  projection?: string | null
  /** La « Mention particulière » de la séance. */
  mention?: string | null
}

/** Une séance de la grille de la semaine, avec le film qu'elle projette. */
export interface SeanceProgramme extends SeanceNewsletter {
  filmId: string | null
  titre: string
  /** L'adresse de la fiche du film sur le site, pour rendre le titre cliquable. */
  slug: string | null
  /** Pour la soirée d'un événement : l'adresse complète de sa page, à la place de celle d'un film. */
  lien?: string | null
  /** « Avant-première · En présence de … », ou null pour une séance ordinaire. */
  particularite: string | null
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
  /** Le type du film, écrit tel quel (« Documentaire »). */
  typeDeFilm: string | null
  /** L'ancienne saisie en étiquettes, lue tant que le type est vide. */
  genres: string[] | null
  synopsis: string | null
  dateDeSortie: string | null
  /** Sa toute première séance chez nous, annulées exclues, à n'importe quelle
      date : c'est d'elle que partent ses semaines quand la date de sortie manque. */
  premiereProjection: string | null
  statut: string | null
  bandeAnnonce: string | null
  presse: string | null
  afficheRef: string | null
  /** L'invité·e de la fiche (« Séance en présence de… »), et son jour s'il n'en vient qu'un. */
  presence?: string | null
  presenceDate?: string | null
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
  /** Le lundi et le mardi de l'envoi, rappelés en grisé au-dessus du programme. */
  lundiEtMardi: SeanceProgramme[]
  /** Les films projetés cette semaine, dans l'ordre où le programme les annonce. */
  filmsDeLaSemaine: FilmNewsletter[]
  /** Ceux qui arrivent : séances après la semaine, ou date de sortie à venir. */
  filmsAVenir: FilmNewsletter[]
  /** Les événements annoncés : ceux qui ont lieu dans la semaine, et ceux
      cochés « Le rappeler dans chaque newsletter » (voir evenements.ts). */
  rendezVous?: EvenementNewsletter[]
  reglages: ReglagesNewsletter
}
