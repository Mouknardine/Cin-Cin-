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
 * pratique.ts ; le logo, la case bleue, l'appel au site et le pied, communs
 * avec la piqûre de rappel, dans cadre.ts. Ce fichier ne fait que les poser
 * dans l'ordre.
 */
import {formatJourLong, formatJourLongAvecAnnee, numeroDeSemaine} from '../utils/dates'
import {appelAuSite, bandeBleue, entete, envelopper, pied} from './cadre'
import {blocFilm, type ProjetSanity} from './film'
import {bandeau, cellule, tableau} from './html'
import {blocPratique} from './pratique'
import {lignesDuProgramme} from './programme'
import {rubriqueRendezVous} from './rendez-vous'
import {jourDeLEnvoi} from './seances'
import type {DonneesNewsletter} from './types'

export type OptionsGabarit = ProjetSanity

/**
 * La case bleue, qui ouvre le programme : « PROGRAMME DU MERCREDI 16 SEPTEMBRE
 * AU MARDI 22 SEPTEMBRE 2026 (38) ». Seuls le lundi et le mardi de l'envoi,
 * en grisé, passent au-dessus d'elle.
 *
 * Tout tient dans une seule case et une seule phrase, en majuscules — c'est
 * la formule que le cinéma écrit depuis toujours dans l'objet de son mail.
 * Le numéro de semaine la referme entre parenthèses, il ne fait plus une
 * ligne à lui seul. Le titre noir « LE PROGRAMME » qui suivait disait la
 * même chose une deuxième fois : il a disparu.
 */
function bandeDeLaSemaine(donnees: DonneesNewsletter): string {
  return bandeBleue(
    `Programme du ${formatJourLong(donnees.debutSemaine)} au ` +
      `${formatJourLongAvecAnnee(donnees.finSemaine)} (${numeroDeSemaine(donnees.debutSemaine)})`,
  )
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
    /* Le lundi et le mardi de l'envoi, en grisé, au-dessus de la case bleue :
       ils ne font pas partie de la semaine qu'elle annonce, mais l'abonné qui
       lit le message ce lundi-là peut encore y aller. */
    (donnees.lundiEtMardi.length
      ? `<tr>${cellule(tableau(lignesDuProgramme(donnees.lundiEtMardi, true)), 'padding:0;')}</tr>`
      : '') +
    bandeDeLaSemaine(donnees) +
    /* Pas de titre au-dessus du programme : la case bleue vient de le dire. */
    `<tr>${cellule(tableau(lignesDuProgramme(donnees.programme)), 'padding:0;')}</tr>` +
    appelAuSite() +
    (filmsDeLaSemaine ? bandeau('Les films de la semaine') + filmsDeLaSemaine : '') +
    /* Le rappel des événements qui reviennent (match d'impro, ciné-club…),
       entre les films de la semaine et ceux qui arrivent. */
    rubriqueRendezVous(donnees.rendezVous, jourDeLEnvoi(donnees.debutSemaine), options) +
    (filmsProchainement ? bandeau('Prochainement') + filmsProchainement : '') +
    blocPratique(donnees.reglages) +
    pied(donnees.reglages)

  return envelopper(corps)
}
