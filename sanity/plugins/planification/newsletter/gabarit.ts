/**
 * Le gabarit de la newsletter : des données Sanity vers du HTML d'e-mail.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE HTML N'EST PAS DU HTML MODERNE.
 *
 * Une messagerie n'est pas un navigateur. Outlook rend le HTML avec le moteur
 * de Word ; Gmail réécrit la feuille de style ; Apple Mail garde ce qu'on lui
 * colle. Rien de tout cela ne comprend la grille, les variables CSS ou une
 * police chargée depuis le web.
 *
 * Alors on écrit comme on écrivait :
 *   - des tableaux imbriqués, jamais de flex ni de grid ;
 *   - des styles en ligne sur chaque case, jamais de feuille de style ;
 *   - Arial, écrite sur chaque case, et trois tailles de texte en tout ;
 *   - des largeurs en proportions, pour que le message rétrécisse avec
 *     l'écran d'un téléphone sans avoir besoin d'une feuille de style.
 *
 * C'est aussi ce qui permet le copier-coller : la personne clique
 * « Copier », colle dans son outil d'envoi, et la mise en page arrive intacte.
 * ---------------------------------------------------------------------------
 *
 * LA DIRECTION ARTISTIQUE VIENT DU SITE.
 *
 * Les couleurs, le trait et la façon de composer sont ceux de zinema.ch
 * (assets/css/style.css) : des cases de papier posées sur l'encre, séparées
 * par un trait unique. Le site pose sa règle ainsi : « deux traits qui se
 * touchent n'en font qu'un » — c'est exactement ce que fait un tableau en
 * border-collapse. La contrainte de l'e-mail et la DA tombent juste.
 *
 * Les blocs vivent chacun dans leur fichier : programme.ts, film.ts,
 * pratique.ts. Ce fichier ne fait que les poser dans l'ordre.
 */
import {formatJourLong, formatJourLongAvecAnnee, numeroDeSemaine} from '../utils/dates'
import type {DonneesNewsletter, ReglagesNewsletter} from './donnees'
import {blocFilm, type ProjetSanity} from './film'
import {
  BLANC, BLEU, ENCRE, LARGEUR, PAPIER, POLICE, SITE, TAILLE, VERT,
  bandeau, cellule, echapper, tableau,
} from './html'
import {blocPratique} from './pratique'
import {lignesDuProgramme} from './programme'

export type OptionsGabarit = ProjetSanity

/**
 * Le logo du cinéma, en blanc, servi par le site lui-même : une adresse que
 * toute messagerie peut aller chercher.
 *
 * Le logo d'origine est noir sur transparence — il disparaîtrait sur l'encre.
 * zinema-logo-blanc.png en est la version inversée, faite pour ce fond-là.
 */
const LOGO = `${SITE}/assets/img/zinema-logo-blanc.png`
const LARGEUR_LOGO = 400

/**
 * L'en-tête : le logo seul, en grand, sur l'encre. Si la messagerie bloque les
 * images, le texte de remplacement s'écrit à sa place — en blanc, pour rester
 * lisible sur ce fond.
 */
function entete(): string {
  return `<tr>${cellule(
    `<a href="${SITE}" style="display:block;color:${BLANC};text-decoration:none;">` +
      `<img src="${LOGO}" width="${LARGEUR_LOGO}" alt="ZINÉMA" style="display:block;width:100%;` +
      `max-width:${LARGEUR_LOGO}px;height:auto;border:0;margin:0 auto;color:${BLANC};font-family:${POLICE};` +
      `font-size:${TAILLE.titre};font-weight:bold;text-align:center;"></a>`,
    `background-color:${ENCRE};padding:22px 16px;text-align:center;`,
    'align="center"',
  )}</tr>`
}

function bandeDeLaSemaine(donnees: DonneesNewsletter): string {
  return `<tr>${cellule(
    `<div style="font-size:${TAILLE.titre};line-height:1.25;font-weight:bold;text-transform:uppercase;">` +
      `Du ${echapper(formatJourLong(donnees.debutSemaine))} au ${echapper(formatJourLongAvecAnnee(donnees.finSemaine))}</div>` +
      `<div style="font-size:${TAILLE.petit};line-height:1.6;font-weight:bold;text-transform:uppercase;">` +
      `Semaine ${numeroDeSemaine(donnees.debutSemaine)}</div>`,
    `background-color:${BLEU};color:${BLANC};padding:10px 14px;`,
  )}</tr>`
}

/** L'appel au site, juste après le programme : toute la case est cliquable. */
function appelAuSite(): string {
  return `<tr>${cellule(
    `<a href="${SITE}/agenda/" style="display:block;color:${BLANC};text-decoration:none;">` +
      `Acheter un billet sur zinema.ch &rarr;</a>`,
    `background-color:${VERT};color:${BLANC};padding:13px 14px;font-size:${TAILLE.titre};` +
      `line-height:1.25;font-weight:bold;`,
  )}</tr>`
}

function pied(reglages: ReglagesNewsletter): string {
  const contacts = [
    reglages.telephone ? `${echapper(reglages.telephone)} (cinéma)` : null,
    reglages.telephoneBis ? `${echapper(reglages.telephoneBis)} (bureau)` : null,
    reglages.email
      ? `<a href="mailto:${echapper(reglages.email)}" style="color:${BLANC};font-weight:bold;">${echapper(reglages.email)}</a>`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return `<tr>${cellule(
    contacts +
      (reglages.iban ? `<br>IBAN ${echapper(reglages.iban)}` : '') +
      `<br>Salle de cinéma fondée en juin 2001 par Laurent Serge Toplitsch.`,
    `background-color:${ENCRE};color:${BLANC};padding:14px;font-size:${TAILLE.petit};line-height:1.7;`,
  )}</tr>`
}

/** L'objet du message, prêt à coller dans la ligne « Objet ». */
export function objetDeLaNewsletter(donnees: DonneesNewsletter): string {
  const semaine = numeroDeSemaine(donnees.debutSemaine)
  return (
    `Programme du ${formatJourLong(donnees.debutSemaine)} au ` +
    `${formatJourLongAvecAnnee(donnees.finSemaine)} (${semaine})`
  ).toUpperCase()
}

/** Le corps du message, en HTML d'e-mail. */
export function construireNewsletter(donnees: DonneesNewsletter, options: OptionsGabarit): string {
  const films = (liste: DonneesNewsletter['filmsDeLaSemaine'], alAffiche: boolean): string =>
    liste.map((film) => blocFilm(film, donnees, options, alAffiche)).join('')
  const filmsDeLaSemaine = films(donnees.filmsDeLaSemaine, true)
  const filmsProchainement = films(donnees.filmsAVenir, false)

  const corps =
    entete() +
    bandeDeLaSemaine(donnees) +
    bandeau('Le programme') +
    `<tr>${cellule(tableau(lignesDuProgramme(donnees.programme)), 'padding:0;')}</tr>` +
    appelAuSite() +
    (filmsDeLaSemaine ? bandeau('Les films de la semaine') + filmsDeLaSemaine : '') +
    (filmsProchainement ? bandeau('Prochainement') + filmsProchainement : '') +
    blocPratique(donnees.reglages) +
    pied(donnees.reglages)

  /* Le message prend toute la largeur d'un téléphone, et s'arrête à 600 px
     ailleurs. Outlook, qui ignore max-width, reçoit sa largeur fixe par un
     tableau qu'il est seul à lire. */
  return (
    `<!--[if mso]><table role="presentation" width="${LARGEUR}" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="center" ` +
    `style="width:100%;max-width:${LARGEUR}px;margin:0 auto;border-collapse:collapse;` +
    `background-color:${PAPIER};color:${ENCRE};font-family:${POLICE};">${corps}</table>` +
    `<!--[if mso]></td></tr></table><![endif]-->`
  )
}
