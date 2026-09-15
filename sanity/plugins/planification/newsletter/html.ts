/**
 * Les briques de la newsletter : les couleurs du site, le trait, la police,
 * les tailles, et les quelques fonctions qui fabriquent des cases d'e-mail sûres.
 *
 * Tout ce qui entre dans le HTML passe par ici : les textes venus de Sanity
 * sont échappés, les adresses vérifiées. Les blocs (programme, films, infos)
 * ne font qu'assembler ces briques.
 */

/* ---- Les couleurs du site, recopiées depuis assets/css/style.css ----
   Un e-mail ne sait pas lire une variable CSS : elles sont écrites en
   clair, une seule fois, ici. */
export const ENCRE = '#100f0c'
export const PAPIER = '#ededed'
export const BLANC = '#ffffff'
export const ROUGE = '#c22a1d'
export const BLEU = '#2f49c2'
export const JAUNE = '#f7c600'
/** L'encre éclaircie : les mentions secondaires, sur papier (6,6:1). */
export const GRIS = '#57534a'
/* Le vert du billet. C'est la seule couleur du site qui ait un sens fixe :
   elle ne sert qu'à acheter une place, nulle part ailleurs (voir --vert dans
   assets/css/style.css). La newsletter respecte la même règle. */
export const VERT = '#275a1b'

/** Le trait du site. Un seul, partout — cases, pastilles d'horaire comprises. */
export const TRAIT = `border:3px solid ${ENCRE};`
/** La largeur d'un e-mail : au-delà, les messageries recadrent. */
export const LARGEUR = 600

/* Une seule police pour tout le message, écrite sur chaque case : un outil
   d'envoi qui enveloppe le collage dans sa propre police ne peut pas la
   remplacer case par case. */
export const POLICE = 'Arial,Helvetica,sans-serif'

/**
 * Les trois seules tailles du message. Un titre de rubrique, un titre de
 * film et la bande de la semaine partagent la même ; le texte courant en a
 * une ; les mentions secondaires, une dernière.
 */
export const TAILLE = {
  titre: '20px',
  texte: '15px',
  petit: '12px',
} as const

/** Le séparateur des listes : l'espace insécable le garde collé à ce qui précède,
    pour qu'une ligne ne commence jamais par un point. */
export const SEPARATEUR = '&nbsp;· '

/* L'adresse du site. Elle est fixe, comme le projet Sanity l'est dans
   sanity.cli.ts : un e-mail parti avec une mauvaise adresse ne se rattrape
   pas, et une variable d'environnement oubliée ne doit pas pouvoir renvoyer
   les abonnés ailleurs. */
export const SITE = 'https://www.zinema.ch'

/** Tout texte venu de Sanity passe par là avant d'entrer dans le HTML. */
export function echapper(valeur: unknown): string {
  return String(valeur ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Empêche une messagerie de transformer « fiff.ch » en lien : un espace
 * invisible glissé avant le point suffit à ce qu'elle n'y reconnaisse plus
 * une adresse. À n'utiliser que sur un texte déjà échappé.
 */
export function sansLienAutomatique(texteEchappe: string): string {
  return texteEchappe.replace(/(\w)\.(?=[a-z]{2,}\b)/gi, '$1&#8203;.')
}

/** L'adresse de la page d'un film sur le site. */
export function lienDuFilm(slug: string | null | undefined): string | null {
  const propre = String(slug ?? '').trim()
  if (!propre) return null
  return echapper(`${SITE}/film/?s=${encodeURIComponent(propre)}`)
}

/** Les sauts de ligne d'un champ « texte » deviennent des paragraphes. */
export function paragraphes(texte: string | null | undefined, style: string): string {
  return String(texte ?? '')
    .split(/\n{2,}/)
    .map((bloc) => bloc.trim())
    .filter(Boolean)
    .map((bloc) => `<p style="margin:0 0 9px;${style}">${echapper(bloc).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Une case bordée du trait du site, dans la police du message. */
export function cellule(contenu: string, style: string, attributs = ''): string {
  return `<td ${attributs} style="${TRAIT}font-family:${POLICE};${style}">${contenu}</td>`
}

/** Un tableau de mise en page, sans bordure propre : ses cases portent le trait. */
export function tableau(lignes: string, style = ''): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="border-collapse:collapse;${style}">${lignes}</table>`
  )
}

/** Le bandeau noir qui ouvre une rubrique. Toutes les rubriques ont la même taille. */
export function bandeau(titre: string): string {
  return `<tr>${cellule(
    echapper(titre),
    `background-color:${ENCRE};color:${BLANC};padding:10px 14px;font-size:${TAILLE.titre};` +
      `line-height:1.25;font-weight:bold;text-transform:uppercase;`,
  )}</tr>`
}
