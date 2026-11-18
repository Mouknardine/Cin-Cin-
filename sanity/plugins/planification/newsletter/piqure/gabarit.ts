/**
 * La piqûre de rappel, en HTML d'e-mail.
 *
 *   ┌─────────────────────────────────────────┐
 *   │ logo                                    │
 *   ├─────────────────────────────────────────┤
 *   │ CASE BLEUE : le titre choisi            │
 *   ├─────────────────────────────────────────┤
 *   │ le mot du cinéma, s'il en écrit un      │
 *   ├─────────────────────────────────────────┤
 *   │ les films et les événements cochés,     │
 *   │ le plus proche d'abord                  │
 *   ├─────────────────────────────────────────┤
 *   │ ACHETER UN BILLET SUR ZINEMA.CH →       │  ← s'il y a un film
 *   ├─────────────────────────────────────────┤
 *   │ pied                                    │
 *   └─────────────────────────────────────────┘
 *
 * Mêmes briques que la newsletter du lundi — cadre.ts, film.ts,
 * rendez-vous.ts —, mêmes contraintes d'e-mail (voir ../gabarit.ts) :
 * l'abonné reconnaît le Zinéma au premier regard. Mais la piqûre ne dit que
 * ce qu'elle a à dire : ni programme de la semaine, ni « Prochainement », ni
 * tarifs.
 */
import {debutDeSemaine} from '../../utils/dates'
import {appelAuSite, bandeBleue, entete, envelopper, pied} from '../cadre'
import {etiquetteDuFilm} from '../etiquette'
import {blocFilmPresente, type ProjetSanity} from '../film'
import {TAILLE, capitales, cellule, paragraphes} from '../html'
import {blocEvenement} from '../rendez-vous'
import type {ReglagesNewsletter} from '../types'
import {dansLOrdre, titreDe, type FilmEnAvant, type MiseEnAvant} from './candidats'

export interface ContenuPiqure {
  envoi: string
  /** Le titre écrit par le cinéma pour la case bleue et l'objet ; vide, les noms cochés. */
  titre: string
  /** Quelques lignes du cinéma sous la case bleue ; vide, rien ne s'affiche. */
  mot: string
  /** Ce qui a été coché, dans n'importe quel ordre. */
  choix: readonly MiseEnAvant[]
  reglages: ReglagesNewsletter
}

/**
 * Le titre proposé tant que le cinéma n'en écrit pas : les noms de ce qu'il
 * a coché, le plus proche d'abord — « Drive My Car et Marché de Noël ».
 */
export function titreParDefaut(choix: readonly MiseEnAvant[]): string {
  const noms = dansLOrdre(choix).map(titreDe)
  if (noms.length <= 1) return noms[0] ?? ''
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`
}

/** Le titre retenu : celui que le cinéma a écrit, sinon les noms de ce qu'il a coché. */
export function titreDuMessage(saisi: string, choix: readonly MiseEnAvant[]): string {
  return saisi.trim() || titreParDefaut(choix)
}

/** L'objet du message : le titre retenu, en capitales, comme le cinéma écrit ses objets. */
export function objetDeLaPiqure(saisi: string, choix: readonly MiseEnAvant[]): string {
  return capitales(titreDuMessage(saisi, choix))
}

/**
 * Un film coché : son étiquette compte les semaines de celle où il passe
 * ensuite, ses bandeaux rappellent ses séances spéciales en toutes lettres,
 * ses pastilles couvrent sept jours (voir candidats.ts).
 */
function blocDuFilm(choix: FilmEnAvant, projet: ProjetSanity): string {
  return blocFilmPresente(choix.film, projet, {
    etiquette: etiquetteDuFilm(choix.film, debutDeSemaine(choix.date)),
    etiquetteEncadree: true,
    seancesDesBandeaux: choix.seances,
    joursAbreges: false,
    pastilles: choix.pastilles,
  })
}

function motDuCinema(mot: string): string {
  const texte = paragraphes(mot, `font-size:${TAILLE.texte};line-height:1.5;`)
  return texte ? `<tr>${cellule(texte, 'padding:12px 14px 5px;')}</tr>` : ''
}

/** Le corps de la piqûre, en HTML d'e-mail ; vide tant que rien n'est coché. */
export function construirePiqure(contenu: ContenuPiqure, projet: ProjetSanity): string {
  if (!contenu.choix.length) return ''
  const blocs = dansLOrdre(contenu.choix)
    .map((choix) => (choix.genre === 'film' ? blocDuFilm(choix, projet) : blocEvenement(choix.evenement, contenu.envoi, projet)))
    .join('')
  /* Le vert ne sert qu'à acheter une place : sans film, pas de bouton. Un
     événement mène à sa page par son titre et son visuel. */
  const avecUnFilm = contenu.choix.some((choix) => choix.genre === 'film')

  return envelopper(
    entete() +
      bandeBleue(titreDuMessage(contenu.titre, contenu.choix)) +
      motDuCinema(contenu.mot) +
      blocs +
      (avecUnFilm ? appelAuSite() : '') +
      pied(contenu.reglages),
  )
}
