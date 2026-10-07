/**
 * Les mesures de la feuille A4, en millimètres.
 *
 * Une semaine compte vingt-huit séances, parfois quarante avec des
 * événements. La hauteur des lignes se calcule d'après leur nombre : une
 * semaine chargée se resserre, une semaine calme respire, et rien ne
 * déborde jamais sur une seconde feuille.
 */
/* ---- La page ---- */
export const HAUTEUR_A4 = 297
export const MARGE = 12
/* Le logo occupe toute la largeur de la feuille, comme dans la newsletter
   (demande du cinéma, 29 septembre 2026). Sa hauteur suit ses proportions :
   762 × 164 pixels. */
const LARGEUR_UTILE = 210 - 2 * MARGE
const PROPORTION_LOGO = 164 / 762
export const HAUTEUR_LOGO = Math.floor(LARGEUR_UTILE * PROPORTION_LOGO * 10) / 10
export const ESPACE_SOUS_LOGO = 6
/** Le trait qui sépare les lignes : il prend sa part de la hauteur. */
export const TRAIT = 0.3
/** Ce qu'on garde en réserve, pour qu'un arrondi du navigateur ne pousse jamais une ligne sur une seconde page. */
const RESERVE = 6

/** Une ligne ne dépasse pas 9 mm : au-delà, une semaine calme aurait l'air vide. */
const LIGNE_MAX = 9
/** En dessous de 3,5 mm, le texte devient trop petit pour être lu au mur. */
export const LIGNE_MIN = 3.5

/* Le bandeau de la semaine compte pour une ligne, de la même hauteur que
   celles des jours : plus haut, il prenait la place d'une séance (demande
   du cinéma, 7 octobre 2026 — l'hiver amène des séances à 15 h, 17 h,
   19 h et 21 h le samedi et le dimanche). */

/** La place laissée au bandeau de la semaine, aux jours et aux séances, une fois le logo posé. */
const PLACE_DU_TABLEAU = HAUTEUR_A4 - 2 * MARGE - HAUTEUR_LOGO - ESPACE_SOUS_LOGO

/* Les lignes sont calculées au plus prudent : chaque trait compté en entier,
   plus une réserve. Le tableau, lui, reçoit la hauteur exacte à remplir :
   le navigateur y étire les lignes jusqu'en bas de la page. Un navigateur
   qui compterait les traits autrement n'a donc jamais de quoi déborder. */
const HAUTEUR_DU_TABLEAU = PLACE_DU_TABLEAU - RESERVE

/* ---- Les couleurs : celles du site, en noir et blanc pour l'imprimante ----

   Trois paliers, du plus fort au plus faible, qui se distinguent encore
   une fois imprimés en noir et blanc :
     - la semaine : noir, texte blanc ;
     - les jours : gris clair, texte noir ;
     - le lundi et le mardi qui précèdent : gris plus clair, texte gris.
   Les jours étaient en gris presque noir : sous le bandeau de la semaine,
   le mercredi faisait avec lui « une grosse barre noire au milieu du
   programme » (demande du cinéma, 5 octobre 2026). */
export const ENCRE = '#100f0c'
export const GRIS_JOUR = '#cfcdc8'
/** Le bandeau d'un jour du lundi-mardi en grisé : plus pâle que ceux de la semaine. */
export const GRIS_AVANT = '#ebeae6'
export const BLANC = '#ffffff'

/** Les mesures d'une feuille, en millimètres. */
export interface MesuresFeuille {
  hauteurLigne: number
  tailleTexte: number
  /** La hauteur occupée par toutes les lignes, traits compris. */
  hauteurTotale: number
  /** La place disponible pour ces lignes. */
  place: number
  /** La hauteur donnée au tableau : toute la page, sans étirer une semaine calme au-delà de 9 mm par ligne. */
  hauteurTableau: number
  /** La hauteur du bandeau de la semaine : la part d'une ligne dans la hauteur donnée aux tableaux. */
  hauteurBandeau: number
}

/** La hauteur de ligne et la taille du texte, d'après le nombre de lignes à loger. */
export function mesuresDeLaFeuille(nbLignes: number): MesuresFeuille {
  const lignes = Math.max(nbLignes, 1)
  const libre = (HAUTEUR_DU_TABLEAU - lignes * TRAIT) / lignes
  /* Arrondi vers le bas : un centième de trop par ligne, multiplié par
     cinquante lignes, suffirait à pousser la dernière sur une autre page. */
  const hauteurLigne = Math.floor(Math.min(LIGNE_MAX, Math.max(LIGNE_MIN, libre)) * 100) / 100
  /* Le texte occupe à peu près les trois cinquièmes de la ligne, plafonné
     à 3,6 mm (environ 10 points) : lisible à un mètre, jamais criard. */
  const tailleTexte = Math.floor(Math.min(3.6, hauteurLigne * 0.6) * 100) / 100
  const hauteurTableau = Math.floor(Math.min(PLACE_DU_TABLEAU - 1, lignes * LIGNE_MAX) * 100) / 100
  return {
    hauteurLigne,
    tailleTexte,
    hauteurTotale: lignes * (hauteurLigne + TRAIT),
    place: HAUTEUR_DU_TABLEAU,
    hauteurTableau,
    hauteurBandeau: Math.floor((hauteurTableau / lignes) * 100) / 100,
  }
}
