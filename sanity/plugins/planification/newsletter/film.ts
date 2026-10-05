/**
 * Un film dans la newsletter.
 *
 * Deux étages, pour qu'il se lise aussi bien sur un téléphone que sur un
 * ordinateur, sans dépendre d'une feuille de style que le collage perdrait :
 *
 *   ┌──────────┬──────────────────────────────┐
 *   │ affiche  │ étiquette, titre, fiche      │
 *   │          │ [LUN 14 19:00] [MER 16 21:15]│
 *   ├──────────┴──────────────────────────────┤
 *   │ synopsis — en pleine largeur            │
 *   └─────────────────────────────────────────┘
 *
 * Pas de lien sous le synopsis : l'affiche, le titre et chaque pastille
 * mènent déjà à la fiche du film, où l'on achète son billet.
 */
import type {DonneesNewsletter, FilmNewsletter} from './donnees'
import {etiquetteDuFilm, type Etiquette, type TonEtiquette} from './etiquette'
import {
  BLANC, BLEU, ENCRE, GRIS, JAUNE, PAPIER, POLICE, ROUGE, SEPARATEUR, TAILLE,
  capitales, cellule, echapper, lienDuFilm, paragraphes, tableau,
} from './html'
import {urlImage} from './image'
import {pastillesDesSeances, seancesAnnoncees} from './seances'

export interface ProjetSanity {
  projectId: string
  dataset: string
}

/** L'affiche est rendue à 180 px au plus ; on la demande au double, pour les écrans fins. */
const LARGEUR_AFFICHE = 180
const HAUTEUR_SANS_AFFICHE = 240

const COULEURS_ETIQUETTE: Record<TonEtiquette, {fond: string; encre: string}> = {
  affiche: {fond: JAUNE, encre: ENCRE},
  reprise: {fond: ROUGE, encre: BLANC},
  avenir: {fond: BLEU, encre: BLANC},
}

/** Le début de style commun à toutes les étiquettes, encadrées ou non. */
const STYLE_ETIQUETTE =
  `font-size:${TAILLE.petit};line-height:1.4;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;`

/**
 * L'étiquette du film. À l'affiche, une pastille de couleur : « 3ÈME SEMAINE ».
 * Prochainement, la date de sortie en simple texte, sans encadré.
 *
 * La pastille de couleur est une case de tableau, comme les pastilles des
 * séances : Word, qui dessine l'Outlook classique, ignore la marge
 * intérieure d'un texte en ligne, et collait le texte au bord du fond jaune.
 */
function etiquette({texte, ton}: Etiquette, alAffiche: boolean): string {
  const texteEnCapitales = echapper(capitales(texte))
  if (!alAffiche) {
    return `<div style="${STYLE_ETIQUETTE}color:${ENCRE};padding-bottom:4px;">${texteEnCapitales}</div>`
  }
  const {fond, encre} = COULEURS_ETIQUETTE[ton]
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">` +
    `<tr><td style="font-family:${POLICE};${STYLE_ETIQUETTE}padding:3px 8px;mso-line-height-rule:exactly;` +
    `background-color:${fond};color:${encre};">${texteEnCapitales}</td></tr></table>`
  )
}

/** « Documentaire · Hercli Bundi · Suisse · 2025 · 96′ · VO st fr · 6/12 ans » */
function ligneTechnique(film: FilmNewsletter): string {
  const version = [film.version, film.sousTitres].map((v) => String(v ?? '').trim()).filter(Boolean)
  return [
    film.typeDeFilm?.trim() || (film.genres ?? []).join(', '),
    film.realisation,
    film.pays,
    film.annee,
    film.duree ? `${film.duree}′` : null,
    version.join(' '),
    film.age,
  ]
    .map((morceau) => String(morceau ?? '').trim())
    .filter(Boolean)
    .map(echapper)
    .join(SEPARATEUR)
}

/** L'affiche est le plus gros objet du bloc : c'est elle qu'on clique d'instinct. */
function caseAffiche(film: FilmNewsletter, projet: ProjetSanity, lien: string | null): string {
  const adresse = urlImage(film.afficheRef, {...projet, largeur: LARGEUR_AFFICHE * 2})
  const image = adresse
    ? `<img src="${adresse}" width="${LARGEUR_AFFICHE}" alt="${echapper(film.titre)}" ` +
      `style="display:block;width:100%;max-width:${LARGEUR_AFFICHE}px;height:auto;border:0;">`
    : /* Sans affiche, une case d'encre plutôt qu'une image cassée. */
      `<div style="height:${HAUTEUR_SANS_AFFICHE}px;line-height:${HAUTEUR_SANS_AFFICHE}px;background-color:${ENCRE};` +
      `text-align:center;color:#6d6a62;font-size:${TAILLE.petit};text-transform:uppercase;">AFFICHE</div>`
  /* La couleur du lien est écrite : sans elle, le nouvel Outlook peint en
     bleu de lien le mot « AFFICHE » d'un film qui n'en a pas encore. */
  return lien
    ? `<a href="${lien}" style="display:block;line-height:0;text-decoration:none;color:#6d6a62;">${image}</a>`
    : image
}

export function blocFilm(
  film: FilmNewsletter,
  donnees: DonneesNewsletter,
  projet: ProjetSanity,
  alAffiche: boolean,
): string {
  const lien = lienDuFilm(film.slug)
  const etiquetteCalculee = etiquetteDuFilm(film, donnees.debutSemaine)

  const titre =
    `<div style="font-size:${TAILLE.titre};line-height:1.15;font-weight:bold;text-transform:uppercase;` +
    `padding-top:${etiquetteCalculee && alAffiche ? '8px' : '0'};">` +
    (lien
      ? `<a href="${lien}" style="color:${ENCRE};text-decoration:none;">${echapper(capitales(film.titre))}</a>`
      : echapper(capitales(film.titre))) +
    `</div>`
  const entete =
    (etiquetteCalculee ? etiquette(etiquetteCalculee, alAffiche) : '') +
    titre +
    `<div style="font-size:${TAILLE.petit};line-height:1.45;font-weight:bold;color:${GRIS};padding-top:5px;">${ligneTechnique(film)}</div>` +
    (alAffiche
      ? pastillesDesSeances(seancesAnnoncees(film.seances, donnees.debutSemaine, donnees.finSemaine), lien)
      : '')

  const synopsis = paragraphes(film.synopsis, `font-size:${TAILLE.texte};line-height:1.5;`)

  /* La case de l'affiche est sur le papier, pas sur l'encre. Sur un
     téléphone, les pastilles peuvent dépasser la hauteur de l'affiche : la
     case s'allonge alors avec elles, et c'est du papier qui continue sous
     l'image — jamais une bande noire qui aurait l'air d'une affiche mal cadrée. */
  const etageHaut =
    '<tr>' +
    cellule(
      caseAffiche(film, projet, lien),
      `width:30%;background-color:${PAPIER};padding:0;font-size:0;line-height:0;`,
      'width="30%" valign="top"',
    ) +
    cellule(entete, 'padding:12px 14px;', 'valign="top"') +
    '</tr>'
  const etageBas = synopsis ? `<tr>${cellule(synopsis, 'padding:12px 14px 5px;', 'colspan="2"')}</tr>` : ''

  return `<tr>${cellule(tableau(etageHaut + etageBas), 'padding:0;')}</tr>`
}
