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
 *   - Helvetica et Arial, les deux polices que toute machine possède.
 *
 * C'est aussi ce qui permet le copier-coller : la personne clique
 * « Copier », colle dans son logiciel de messagerie, et la mise en page
 * arrive intacte.
 * ---------------------------------------------------------------------------
 *
 * LA DIRECTION ARTISTIQUE VIENT DU SITE.
 *
 * Les couleurs, le trait et la façon de composer sont ceux de zinema.ch
 * (assets/css/style.css) : des cases de papier posées sur l'encre, séparées
 * par un trait unique. Le site pose sa règle ainsi : « deux traits qui se
 * touchent n'en font qu'un » — c'est exactement ce que fait un tableau en
 * border-collapse. La contrainte de l'e-mail et la DA tombent juste.
 */
import {PARRAIN_DE_SALLE, SALLES, rangDeSalle, type NomDeSalle} from '../../../salles'
import {
  formatJourAbrege,
  formatJourLong,
  formatJourLongAvecAnnee,
  numeroDeSemaine,
  numeroDuJour,
} from '../utils/dates'
import type {
  DonneesNewsletter,
  FilmNewsletter,
  SeanceNewsletter,
  SeanceProgramme,
} from './donnees'
import {etiquetteDuFilm, type TonEtiquette} from './etiquette'
import {urlImage} from './image'

/* ---- Les couleurs du site, recopiées depuis assets/css/style.css ----
   Un e-mail ne sait pas lire une variable CSS : elles sont écrites en
   clair, une seule fois, ici. */
const ENCRE = '#100f0c'
const PAPIER = '#ededed'
const ROUGE = '#c22a1d'
const BLEU = '#2f49c2'
const JAUNE = '#f7c600'
/** L'encre éclaircie : les mentions secondaires, sur papier. */
const GRIS = '#57534a'
/** Le papier assombri : les mentions secondaires, sur encre. */
const GRIS_CLAIR = '#a9a69e'

/** Le trait du site. Un seul, partout. */
const TRAIT = `border:3px solid ${ENCRE};`
/** La largeur d'un e-mail : au-delà, les messageries recadrent. */
const LARGEUR = 600
/** L'affiche est rendue à 150 px ; on la demande au double, pour les écrans fins. */
const LARGEUR_AFFICHE = 300

const POLICE = `'Helvetica Neue',Helvetica,Arial,sans-serif`

/** Les couleurs qui se relaient d'un jour à l'autre, jamais deux fois de suite. */
const COULEURS_DES_JOURS: {fond: string; encre: string}[] = [
  {fond: ROUGE, encre: '#ffffff'},
  {fond: JAUNE, encre: ENCRE},
  {fond: BLEU, encre: '#ffffff'},
]

const COULEURS_ETIQUETTE: Record<TonEtiquette, {fond: string; encre: string}> = {
  affiche: {fond: JAUNE, encre: ENCRE},
  reprise: {fond: ROUGE, encre: '#ffffff'},
  avenir: {fond: BLEU, encre: '#ffffff'},
}

/** Tout texte venu de Sanity passe par là avant d'entrer dans le HTML. */
function echapper(valeur: unknown): string {
  return String(valeur ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Une adresse ne rentre dans un href que si elle est http(s) ou mailto. */
function lienSur(url: string | null | undefined): string | null {
  const propre = String(url ?? '').trim()
  return /^(https?:\/\/|mailto:)/i.test(propre) ? echapper(propre) : null
}

/** Les sauts de ligne d'un champ « texte » deviennent des paragraphes. */
function paragraphes(texte: string | null | undefined, style: string): string {
  return String(texte ?? '')
    .split(/\n{2,}/)
    .map((bloc) => bloc.trim())
    .filter(Boolean)
    .map((bloc) => `<p style="margin:0 0 7px;${style}">${echapper(bloc).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function cellule(contenu: string, style: string, attributs = ''): string {
  return `<td ${attributs} style="${TRAIT}${style}">${contenu}</td>`
}

function bandeau(titre: string): string {
  return `<tr>${cellule(
    echapper(titre),
    `background-color:${ENCRE};color:${PAPIER};padding:7px 12px;font-size:11px;` +
      `line-height:1.3;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;`,
  )}</tr>`
}

/** Une pastille d'étiquette : « 2ᵉ semaine », « Reprise », « Sortie le… ». */
function pastille(texte: string, ton: TonEtiquette): string {
  const {fond, encre} = COULEURS_ETIQUETTE[ton]
  return (
    `<span style="display:inline-block;background-color:${fond};color:${encre};` +
    `padding:2px 7px;font-size:9px;line-height:1.5;font-weight:900;` +
    `letter-spacing:0.14em;text-transform:uppercase;">${echapper(texte)}</span>`
  )
}

/** « Documentaire · Hercli Bundi · Suisse · 2025 · 96′ · VO st fr · 6/12 ans » */
function ligneTechnique(film: FilmNewsletter): string {
  const version = [film.version, film.sousTitres].map((v) => String(v ?? '').trim()).filter(Boolean)
  return [
    (film.genres ?? []).join(', '),
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
    .join(' · ')
}

/* ------------------------------------------------------------------
   Le programme de la semaine.
   ------------------------------------------------------------------ */

function lignesDuProgramme(programme: SeanceProgramme[]): string {
  /* Les séances arrivent déjà dans l'ordre du programme : il suffit de les
     regrouper par date sans les rebattre. */
  const parJour = new Map<string, SeanceProgramme[]>()
  for (const seance of programme) {
    const jour = parJour.get(seance.date)
    if (jour) jour.push(seance)
    else parJour.set(seance.date, [seance])
  }

  const lignes: string[] = []
  let rangDuJour = 0
  for (const [date, seances] of parJour) {
    const couleur = COULEURS_DES_JOURS[rangDuJour % COULEURS_DES_JOURS.length]
    rangDuJour += 1

    seances.forEach((seance, index) => {
      /* Le rail de couleur porte le jour, et s'étire sur toutes ses séances :
         la semaine se lit d'un coup d'œil, bloc par bloc. */
      const rail =
        index === 0
          ? cellule(
              `<div style="font-size:10px;line-height:1.2;font-weight:700;letter-spacing:0.1em;` +
                `text-transform:uppercase;">${echapper(formatJourAbrege(date))}</div>` +
                `<div style="font-size:20px;line-height:1.1;font-weight:900;">${echapper(numeroDuJour(date))}</div>`,
              `background-color:${couleur.fond};color:${couleur.encre};padding:4px 6px;width:56px;`,
              `rowspan="${seances.length}" width="56" valign="middle" align="center"`,
            )
          : ''

      lignes.push(
        `<tr>${rail}` +
          cellule(
            echapper(seance.heure),
            `padding:5px 8px;width:58px;font-size:14px;line-height:1.2;font-weight:900;white-space:nowrap;`,
            'width="58"',
          ) +
          cellule(
            echapper(seance.salle),
            `padding:5px 6px;width:56px;font-size:11px;line-height:1.2;font-weight:700;` +
              `color:${GRIS};white-space:nowrap;`,
            'width="56"',
          ) +
          cellule(
            echapper(seance.titre),
            `padding:5px 8px;font-size:13px;line-height:1.2;font-weight:900;` +
              `text-transform:uppercase;letter-spacing:-0.01em;`,
          ) +
          '</tr>',
      )
    })
  }

  return lignes.join('')
}

/* ------------------------------------------------------------------
   Un film.
   ------------------------------------------------------------------ */

/** « Mer 16, 21h00 » — et en rouge si la séance est déjà passée. */
function lignesDeSeances(
  seances: SeanceNewsletter[],
  debutSemaine: string,
): string {
  return seances
    .filter((seance) => seance.statut !== 'annule')
    .map((seance) => {
      const passee = seance.date < debutSemaine
      const texte = echapper(
        `${formatJourAbrege(seance.date)} ${numeroDuJour(seance.date)}, ${seance.heure}`,
      )
      return passee ? `<span style="color:${ROUGE};">${texte}</span>` : texte
    })
    .join(' · ')
}

function blocFilm(
  film: FilmNewsletter,
  donnees: DonneesNewsletter,
  projet: {projectId: string; dataset: string},
  options: {hauteurAffiche: number; avecSeances: boolean},
): string {
  const etiquette = etiquetteDuFilm(film, donnees.debutSemaine)
  const affiche = urlImage(film.afficheRef, {...projet, largeur: LARGEUR_AFFICHE})
  const bandeAnnonce = lienSur(film.bandeAnnonce)
  const presse = lienSur(film.presse)
  const seances = options.avecSeances
    ? lignesDeSeances(film.seances, donnees.debutSemaine)
    : ''

  const caseAffiche = affiche
    ? `<img src="${affiche}" width="150" alt="${echapper(film.titre)}" ` +
      `style="display:block;width:150px;max-width:150px;height:auto;border:0;">`
    : /* Sans affiche, une case d'encre plutôt qu'une image cassée. */
      `<div style="height:${options.hauteurAffiche}px;line-height:${options.hauteurAffiche}px;` +
      `text-align:center;color:#6d6a62;font-size:9px;letter-spacing:0.14em;` +
      `text-transform:uppercase;">Affiche</div>`

  const liens = [
    bandeAnnonce
      ? `<a href="${bandeAnnonce}" style="color:${BLEU};font-weight:700;">Bande-annonce</a>`
      : null,
    presse ? `<a href="${presse}" style="color:${BLEU};font-weight:700;">Presse</a>` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    `<tr>${cellule(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr>` +
        cellule(
          caseAffiche,
          `width:150px;background-color:${ENCRE};padding:0;font-size:0;line-height:0;`,
          'width="150" valign="top"',
        ) +
        cellule(
          (etiquette ? pastille(etiquette.texte, etiquette.ton) : '') +
            `<div style="font-size:19px;line-height:1.05;font-weight:900;letter-spacing:-0.02em;` +
            `text-transform:uppercase;padding-top:${etiquette ? '7px' : '0'};">${echapper(film.titre)}</div>` +
            `<div style="font-size:11px;line-height:1.45;font-weight:700;color:${GRIS};padding-top:4px;">${ligneTechnique(film)}</div>` +
            `<div style="padding-top:7px;">${paragraphes(film.synopsis, 'font-size:12.5px;line-height:1.5;')}</div>` +
            (seances
              ? `<div style="font-size:11px;line-height:1.6;padding-top:2px;">${seances}</div>`
              : '') +
            (liens ? `<div style="font-size:11px;line-height:1.5;padding-top:6px;">${liens}</div>` : ''),
          `padding:10px 12px 11px;`,
          'valign="top"',
        ) +
        `</tr></table>`,
      'padding:0;',
    )}</tr>`
  )
}

/* ------------------------------------------------------------------
   Le bloc « Pratique » : tarifs, salles.
   ------------------------------------------------------------------ */

function blocPratique(donnees: DonneesNewsletter): string {
  const {reglages} = donnees
  const conditions = (reglages.conditionsReduit ?? []).join(', ')

  const tarif = (montant: number | null, libelle: string): string =>
    montant === null
      ? ''
      : `<tr>${cellule(
          `${echapper(montant)}.–`,
          `background-color:${JAUNE};color:${ENCRE};padding:6px 8px;width:52px;` +
            `font-size:15px;line-height:1.2;font-weight:900;text-align:center;`,
          'width="52"',
        )}${cellule(libelle, 'padding:6px 10px;font-size:12px;line-height:1.4;')}</tr>`

  /* Les salles viennent des réglages pour leur nombre de places, et de
     sanity/salles.ts pour leur parrain — deux sources, une seule ligne. */
  const salles = [...(reglages.salles ?? [])]
    .sort((a, b) => rangDeSalle(a?.nom) - rangDeSalle(b?.nom))
    .map((salle) => {
      const nom = String(salle?.nom ?? '')
      const parrain = (SALLES as readonly string[]).includes(nom)
        ? PARRAIN_DE_SALLE[nom as NomDeSalle]
        : ''
      const details = [parrain, salle?.places ? `${salle.places} places` : '']
        .filter(Boolean)
        .map(echapper)
        .join(' — ')
      return `<b style="color:${ENCRE};">${echapper(nom)}</b>${details ? ` — ${details}` : ''}`
    })
    .join('<br>')

  return (
    bandeau('Pratique') +
    `<tr>${cellule(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">` +
        tarif(reglages.tarifPlein, 'Tarif ordinaire') +
        tarif(reglages.tarifReduit, conditions || 'Tarif réduit') +
        `<tr>${cellule(
          `<b>Pas de cartes bancaires</b> : espèces ou TWINT. ` +
            `<b>Pas de réservations</b> : billets en vente à la buvette 15 minutes avant la séance.`,
          'padding:7px 10px;font-size:12px;line-height:1.5;',
          'colspan="2"',
        )}</tr>` +
        (salles
          ? `<tr>${cellule(
              salles,
              `padding:7px 10px;font-size:11.5px;line-height:1.6;color:${GRIS};`,
              'colspan="2"',
            )}</tr>`
          : '') +
        `</table>`,
      'padding:0;',
    )}</tr>`
  )
}

/* ------------------------------------------------------------------
   La newsletter entière.
   ------------------------------------------------------------------ */

export interface OptionsGabarit {
  projectId: string
  dataset: string
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
export function construireNewsletter(
  donnees: DonneesNewsletter,
  options: OptionsGabarit,
): string {
  const {reglages} = donnees
  const semaine = numeroDeSemaine(donnees.debutSemaine)
  const adresse = String(reglages.adresse ?? '')
    .split('\n')
    .map((ligne) => echapper(ligne.trim()))
    .filter(Boolean)
    .join('<br>')

  const contacts = [
    reglages.telephone ? `${echapper(reglages.telephone)} <span style="color:#6d6a62;">(cinéma)</span>` : null,
    reglages.telephoneBis
      ? `${echapper(reglages.telephoneBis)} <span style="color:#6d6a62;">(bureau)</span>`
      : null,
    reglages.email
      ? `<a href="mailto:${echapper(reglages.email)}" style="color:${PAPIER};font-weight:700;">${echapper(reglages.email)}</a>`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const filmsDeLaSemaine = donnees.filmsDeLaSemaine
    .map((film) =>
      blocFilm(film, donnees, options, {hauteurAffiche: 176, avecSeances: true}),
    )
    .join('')

  const filmsAVenir = donnees.filmsAVenir
    .map((film) =>
      blocFilm(film, donnees, options, {hauteurAffiche: 132, avecSeances: false}),
    )
    .join('')

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${LARGEUR}" ` +
    `style="width:${LARGEUR}px;max-width:100%;border-collapse:collapse;background-color:${PAPIER};` +
    `color:${ENCRE};font-family:${POLICE};">` +
    /* En-tête */
    `<tr>${cellule(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
        `<td valign="middle" style="font-size:27px;line-height:1;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;">Zinéma</td>` +
        `<td valign="middle" align="right" style="font-size:10px;line-height:1.5;letter-spacing:0.12em;text-transform:uppercase;color:${GRIS_CLAIR};">${adresse}</td>` +
        `</tr></table>`,
      `background-color:${ENCRE};color:${PAPIER};padding:14px 14px 12px;`,
    )}</tr>` +
    /* La semaine */
    `<tr>${cellule(
      `<span style="font-size:15px;line-height:1.2;font-weight:900;letter-spacing:-0.01em;text-transform:uppercase;">` +
        `Du ${echapper(formatJourLong(donnees.debutSemaine))} au ${echapper(formatJourLongAvecAnnee(donnees.finSemaine))}</span>` +
        `<span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;"> &nbsp;·&nbsp; Semaine ${semaine}</span>`,
      `background-color:${BLEU};color:#ffffff;padding:9px 14px;`,
    )}</tr>` +
    /* Le programme */
    bandeau('Le programme') +
    `<tr>${cellule(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">` +
        lignesDuProgramme(donnees.programme) +
        `</table>`,
      'padding:0;',
    )}</tr>` +
    /* Les films */
    (filmsDeLaSemaine ? bandeau('Les films de la semaine') + filmsDeLaSemaine : '') +
    (filmsAVenir ? bandeau('À venir') + filmsAVenir : '') +
    /* Pratique */
    blocPratique(donnees) +
    /* Pied */
    `<tr>${cellule(
      contacts +
        (reglages.iban ? `<br>IBAN ${echapper(reglages.iban)}` : '') +
        `<br><span style="color:#6d6a62;">Salle de cinéma fondée en juin 2001 par Laurent Serge Toplitsch.</span>`,
      `background-color:${ENCRE};color:${GRIS_CLAIR};padding:12px 14px;font-size:11.5px;line-height:1.7;`,
    )}</tr>` +
    `</table>`
  )
}
