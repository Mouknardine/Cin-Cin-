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
export const HAUTEUR_LOGO = 22
export const ESPACE_SOUS_LOGO = 6
export const HAUTEUR_TITRE = 10
/** Le trait qui sépare les lignes : il prend sa part de la hauteur. */
export const TRAIT = 0.3
/** Ce qu'on garde en réserve, pour qu'un arrondi du navigateur ne pousse jamais une ligne sur une seconde page. */
const RESERVE = 6

/** Une ligne ne dépasse pas 9 mm : au-delà, une semaine calme aurait l'air vide. */
const LIGNE_MAX = 9
/** En dessous de 3,5 mm, le texte devient trop petit pour être lu au mur. */
export const LIGNE_MIN = 3.5

/** La place laissée aux jours et aux séances, une fois le logo et le titre posés. */
const PLACE_DU_TABLEAU = HAUTEUR_A4 - 2 * MARGE - HAUTEUR_LOGO - ESPACE_SOUS_LOGO - HAUTEUR_TITRE

/* Les lignes sont calculées au plus prudent : chaque trait compté en entier,
   plus une réserve. Le tableau, lui, reçoit la hauteur exacte à remplir :
   le navigateur y étire les lignes jusqu'en bas de la page. Un navigateur
   qui compterait les traits autrement n'a donc jamais de quoi déborder. */
const HAUTEUR_DU_TABLEAU = PLACE_DU_TABLEAU - RESERVE

/* ---- Les couleurs : celles du site, en noir et blanc pour l'imprimante ---- */
export const ENCRE = '#100f0c'
export const GRIS_JOUR = '#3d3b37'
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
  return {
    hauteurLigne,
    tailleTexte,
    hauteurTotale: lignes * (hauteurLigne + TRAIT),
    place: HAUTEUR_DU_TABLEAU,
    hauteurTableau: Math.floor(Math.min(PLACE_DU_TABLEAU - 1, lignes * LIGNE_MAX) * 100) / 100,
  }
}
