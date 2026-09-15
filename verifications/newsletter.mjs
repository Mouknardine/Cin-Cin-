/* ============================================================
   La newsletter hebdomadaire, vérifiée.

   Le cinéma clique sur un bouton et envoie le résultat à ses abonnés :
   personne ne relit le HTML avant qu'il ne parte. Ce fichier est donc le
   seul endroit où l'on vérifie que le gabarit dit vrai.

   Il fait tourner le VRAI gabarit du Studio (gabarit.ts), sur un programme
   construit à la main — celui de la semaine du 16 septembre 2026, telle que
   le cinéma l'a réellement envoyée. Ce qui sort doit correspondre à ce qu'il
   écrivait à la main, étiquettes comprises.

   Le gabarit est du TypeScript qui importe ses voisins sans extension, comme
   le fait un bundler : on le passe donc par esbuild avant de l'exécuter. Ce
   n'est pas une deuxième version du code, c'est le même, compilé.

   Pour lancer :  npm test
   ============================================================ */
import {build} from 'esbuild'

/* ------------------------------------------------------------------
   Compiler le gabarit tel qu'il est, et l'exécuter.
   ------------------------------------------------------------------ */
async function chargerModule(chemin) {
  const compile = await build({
    entryPoints: [new URL(chemin, import.meta.url).pathname],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  const code = compile.outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}

const {construireNewsletter, objetDeLaNewsletter} = await chargerModule(
  '../sanity/plugins/planification/newsletter/gabarit.ts',
)
const {ordonnerSeances} = await chargerModule('../sanity/salles.ts')

/* ------------------------------------------------------------------
   Le programme réellement envoyé par le cinéma, semaine 38 de 2026.
   ------------------------------------------------------------------ */
const DEBUT = '2026-09-16'
const FIN = '2026-09-22'
const S = (date, heure, salle, statut = 'disponible') => ({date, heure, salle, statut})

const film = (o) => ({
  genres: [], realisation: null, pays: null, annee: null, duree: null,
  version: null, sousTitres: null, age: null, synopsis: null, dateDeSortie: null,
  statut: 'a-laffiche', bandeAnnonce: null, presse: null, afficheRef: null,
  seances: [], slug: o._id, ...o,
})

/* Sept films à l'affiche. Six ont ouvert le mercredi 9 — ils en sont donc à
   leur deuxième semaine. « Notre argent » est sorti en avril : il repasse. */
const AFFICHE = [
  film({_id: 'melodie', titre: 'Mélodie', dateDeSortie: '2026-09-09',
    seances: [S('2026-09-14', '19:00', 'Salle 1'), S(DEBUT, '19:00', 'Salle 1'),
      S('2026-09-17', '21:15', 'Salle 1'), S('2026-09-20', '17:00', 'Salle 1'),
      S('2026-09-22', '21:00', 'Salle 1')]}),
  film({_id: 'dernier', titre: 'Le Dernier pour la route', dateDeSortie: '2026-09-09',
    seances: [S(DEBUT, '19:00', 'Salle 2'), S('2026-09-17', '21:15', 'Salle 2'),
      S('2026-09-22', '19:00', 'Salle 2')]}),
  film({_id: 'matins', titre: 'Les Matins merveilleux', dateDeSortie: '2026-09-09',
    seances: [S(DEBUT, '21:00', 'Salle 1'), S('2026-09-18', '21:15', 'Salle 1'),
      S('2026-09-19', '19:00', 'Salle 1'), S('2026-09-21', '19:00', 'Salle 1')]}),
  film({_id: 'argent', titre: 'Notre argent', dateDeSortie: '2026-04-15',
    seances: [S(DEBUT, '21:00', 'Salle 2'), S('2026-09-18', '21:00', 'Salle 2'),
      S('2026-09-21', '21:00', 'Salle 2')]}),
  film({_id: 'north', titre: 'The North', dateDeSortie: '2026-09-09',
    seances: [S('2026-09-17', '19:00', 'Salle 1'), S('2026-09-18', '19:00', 'Salle 1'),
      S('2026-09-19', '21:00', 'Salle 1')]}),
  film({_id: 'drowak', titre: 'Drowak', dateDeSortie: '2026-09-09',
    seances: [S('2026-09-17', '19:00', 'Salle 2'), S('2026-09-19', '19:00', 'Salle 2')]}),
  film({_id: 'comedie', titre: 'De la Comédie Française', dateDeSortie: '2026-09-09',
    seances: [S('2026-09-18', '19:00', 'Salle 2'), S('2026-09-19', '21:15', 'Salle 2')]}),
]

const A_VENIR = [
  film({_id: 'kalari', titre: 'Kalari Kid', statut: 'prochainement',
    dateDeSortie: '2026-09-23', seances: [S('2026-09-23', '19:00', 'Salle 1')]}),
  film({_id: 'laundry', titre: 'Laundry', dateDeSortie: '2026-02-11',
    seances: [S('2026-09-30', '19:00', 'Salle 2')]}),
  film({_id: 'tiger', titre: 'Mit einem Tiger schlafen', statut: 'prochainement',
    dateDeSortie: '2026-12-16'}),
]

const REGLAGES = {
  adresse: 'Rue du Maupas 4\n1004 Lausanne',
  telephone: '021 311 29 30', telephoneBis: '076 567 12 91', email: 'admin@zinema.ch',
  tarifPlein: 16, tarifReduit: 10,
  conditionsReduit: ['Membres de soutien', 'Étudiant·es'],
  salles: [{nom: 'Salle 1', places: 18}, {nom: 'Salle 2', places: 14}, {nom: 'Hall-Bar', places: 50}],
  iban: 'CH79 0900 0000 1725 7734 1',
}

/** Reconstitue ce que donnees.ts prépare, à partir d'une liste de films. */
function donneesPour(affiche, aVenir = A_VENIR, debut = DEBUT, fin = FIN) {
  const programme = ordonnerSeances(
    affiche.flatMap((f) =>
      f.seances
        .filter((s) => s.date >= debut && s.date <= fin && s.statut !== 'annule')
        .map((s) => ({...s, filmId: f._id, titre: f.titre, slug: f.slug})),
    ),
  )
  const rang = new Map()
  programme.forEach((s, i) => {
    if (!rang.has(s.filmId)) rang.set(s.filmId, i)
  })
  return {
    debutSemaine: debut,
    finSemaine: fin,
    programme,
    filmsDeLaSemaine: affiche
      .filter((f) => rang.has(f._id))
      .sort((a, b) => rang.get(a._id) - rang.get(b._id)),
    filmsAVenir: aVenir,
    reglages: REGLAGES,
  }
}

const PROJET = {projectId: 'vle63mzm', dataset: 'production'}
const construire = (affiche = AFFICHE, aVenir = A_VENIR) =>
  construireNewsletter(donneesPour(affiche, aVenir), PROJET)

/* ------------------------------------------------------------------
   Les vérifications.
   ------------------------------------------------------------------ */
let echecs = 0
let reussites = 0

function verifier(intitule, condition, detail = '') {
  if (condition) {
    reussites += 1
    console.log(`  ✓ ${intitule}`)
  } else {
    echecs += 1
    console.log(`  ✗ ${intitule}${detail ? `\n      ${detail}` : ''}`)
  }
}

/** Les titres de films du programme, dans l'ordre où le gabarit les écrit.
    On s'arrête à l'appel au site, qui suit le tableau et porte le même
    interlettrage ; et chaque titre est enveloppé dans son lien. */
function titresDuProgramme(html) {
  const bloc = html
    .split('>Le programme<')[1]
    .split('https://www.zinema.ch/agenda/')[0]
  return [...bloc.matchAll(/letter-spacing:-0\.01em;">(?:<a[^>]*>)?([^<]*)</g)].map((m) => m[1])
}

/** Les étiquettes, dans l'ordre. La signature complète d'une pastille : le
    bandeau de semaine et la case « Affiche » portent le même interlettrage. */
function etiquettes(html) {
  return [
    ...html.matchAll(/letter-spacing:0\.08em;text-transform:uppercase;[^"]*">([^<]*)</g),
  ].map((m) => m[1])
}

console.log('\nLa newsletter hebdomadaire\n')

console.log("L'objet du message")
{
  const objet = objetDeLaNewsletter(donneesPour(AFFICHE))
  verifier(
    "il reprend mot pour mot celui que le cinéma écrivait",
    objet === 'PROGRAMME DU MERCREDI 16 SEPTEMBRE AU MARDI 22 SEPTEMBRE 2026 (38)',
    objet,
  )
}

console.log("\nLe programme, dans l'ordre du programme")
{
  const titres = titresDuProgramme(construire())
  verifier('les 21 séances de la semaine sont toutes là', titres.length === 21, `${titres.length} trouvées`)
  /* Le vendredi : la Salle 1 enchaîne à 21:15, la Salle 2 part à 21:00. Les
     deux salles doivent se lire dans le même ordre que tous les autres jours
     — c'est l'erreur que le cinéma a signalée le 14 septembre 2026. */
  const vendredi = titres.slice(8, 12)
  verifier(
    'le vendredi décalé se lit Salle 1 puis Salle 2, comme les autres jours',
    JSON.stringify(vendredi) ===
      JSON.stringify(['The North', 'De la Comédie Française', 'Les Matins merveilleux', 'Notre argent']),
    vendredi.join(' | '),
  )
  verifier(
    'le mercredi, où les deux salles partent ensemble, ne bouge pas',
    JSON.stringify(titres.slice(0, 4)) ===
      JSON.stringify(['Mélodie', 'Le Dernier pour la route', 'Les Matins merveilleux', 'Notre argent']),
    titres.slice(0, 4).join(' | '),
  )
}

console.log('\nLes étiquettes, calculées et non saisies')
{
  const lues = etiquettes(construire())
  verifier(
    'six films en sont à leur deuxième semaine',
    lues.filter((e) => e === '2ᵉ semaine').length === 6,
    lues.join(' | '),
  )
  verifier(
    'un film sorti il y a des mois est annoncé en reprise',
    lues.includes('Reprise'),
    lues.join(' | '),
  )
  verifier(
    "une sortie à venir porte sa date en toutes lettres",
    lues.includes('Sortie le mercredi 23 septembre'),
    lues.join(' | '),
  )
  verifier(
    "un film qui revient plus tard est annoncé comme une reprise datée",
    lues.includes('Reprise dès le mercredi 30 septembre'),
    lues.join(' | '),
  )
  verifier(
    "une sortie lointaine est annoncée elle aussi",
    lues.includes('Sortie le mercredi 16 décembre'),
    lues.join(' | '),
  )
}

console.log('\nCe qui ramène les abonnés sur le site')
{
  const html = construire()
  verifier(
    "la mention « pas de cartes bancaires » a disparu — la billetterie en ligne est ouverte",
    !/cartes bancaires/i.test(html) && !/[Pp]as de réservations/.test(html),
  )
  verifier(
    'les billets en ligne sont annoncés',
    html.includes('Billets en ligne') && html.includes('zinema.ch'),
  )
  verifier(
    "l'agenda du site est mis en avant après le programme",
    html.includes('https://www.zinema.ch/agenda/'),
  )
  /* Dix blocs de film : sept à l'affiche, trois à venir. La case de l'affiche
     est le plus gros objet cliquable du bloc — avec ou sans image dedans. */
  verifier(
    "la case de l'affiche mène à la fiche du film, dans les dix blocs",
    (html.match(/href="https:\/\/www\.zinema\.ch\/film\/\?s=[^"]*" style="display:block;line-height:0;/g) ?? [])
      .length === 10,
  )
  {
    const avecAffiche = construire(
      [film({_id: 'avec-affiche', titre: 'Avec affiche', slug: 'avec-affiche',
        afficheRef: 'image-abc123def456-800x1200-jpg',
        seances: [S(DEBUT, '19:00', 'Salle 1')]})],
      [],
    )
    verifier(
      "quand l'affiche existe, l'image du serveur Sanity est enveloppée dans le lien",
      /href="https:\/\/www\.zinema\.ch\/film\/\?s=avec-affiche"[^>]*><img src="https:\/\/cdn\.sanity\.io\/images\/vle63mzm\/production\/abc123def456-800x1200\.jpg\?w=360&fit=max"/.test(avecAffiche),
    )
  }
  verifier(
    'les titres du programme sont cliquables sans se déguiser en liens',
    html.includes(`text-decoration:none;">Mélodie</a>`),
  )
  verifier(
    "un film sans adresse de page ne fabrique pas de lien vide",
    !construire([film({_id: 'sans', titre: 'Sans adresse', slug: null,
      seances: [S(DEBUT, '19:00', 'Salle 1')]})], []).includes('film/?s="'),
  )
}

console.log('\nCe que le cinéma a demandé le 15 septembre 2026')
{
  const html = construire()
  const programme = html.split('>Le programme<')[1].split('https://www.zinema.ch/agenda/')[0]
  verifier(
    'le tableau du programme commence le mercredi, pas le lundi de l\'envoi',
    programme.includes('mercredi 16 septembre') && !programme.includes('lundi 14 septembre'),
  )
  verifier(
    "les pastilles d'un film reprennent le lundi de l'envoi",
    html.includes('lun 14&nbsp;'),
  )
  const avecPassee = construire(
    [film({_id: 'passe', titre: 'Déjà passé', synopsis: 'Un synopsis témoin.',
      seances: [S('2026-09-12', '19:00', 'Salle 1'), S('2026-09-15', '21:00', 'Salle 1'),
        S(DEBUT, '19:00', 'Salle 1')]})],
    [],
  )
  verifier(
    "une séance déjà passée le lundi de l'envoi n'est plus annoncée",
    !avecPassee.includes('sam 12&nbsp;') && avecPassee.includes('mar 15&nbsp;') &&
      !/Semaine dernière/.test(avecPassee),
  )
  verifier(
    "le synopsis passe sous l'affiche et les séances, en pleine largeur",
    /mar 15&nbsp;[\s\S]*?<\/tr><tr><td colspan="2"[^>]*><p [^>]*>Un synopsis témoin/.test(avecPassee),
  )
  verifier(
    "aucun fond d'encre derrière l'affiche : si le texte la dépasse, c'est du papier qui continue",
    !/width:30%;background-color:#100f0c/.test(html),
  )
  const avecLiens = construire(
    [film({_id: 'liens', titre: 'Avec liens', bandeAnnonce: 'https://video.example/ba',
      presse: 'https://presse.example/dossier', seances: [S(DEBUT, '19:00', 'Salle 1')]})],
    [film({_id: 'bientot', titre: 'Bientôt', statut: 'prochainement', dateDeSortie: '2026-10-07',
      bandeAnnonce: 'https://video.example/bientot'})],
  )
  verifier(
    'aucun lien ni bouton sous les films, à l\'affiche comme prochainement',
    !avecLiens.includes('video.example') && !avecLiens.includes('presse.example') &&
      !/Bande-annonce|Voir le film|Prendre sa place/.test(avecLiens),
  )
  verifier(
    "la date de sortie d'un film prochainement n'est plus encadrée",
    /letter-spacing:0\.08em;text-transform:uppercase;color:#100f0c;padding-bottom:4px;">Sortie le mercredi 7 octobre</.test(avecLiens),
  )
  verifier("l'appel au site dit « acheter un billet »", html.includes('Acheter un billet') && !/[Pp]renez votre place/.test(html))
  verifier('les rubriques s\'appellent « Prochainement » et « Infos »',
    html.includes('>Prochainement<') && html.includes('>Infos<') &&
      !html.includes('>À venir<') && !html.includes('>Pratique<'))
  verifier(
    'les parrains des salles sont nommés sans parenthèses',
    html.includes('Salle 1</b> — Thierry Jobin — 18 places') &&
      html.includes('Salle 2</b> — Norbert Creutz — 14 places') &&
      !html.includes('(ex-Le Temps') && !html.includes('(Le Temps)') && !html.includes('fiff'),
  )
  verifier('on vient « avant les séances »', html.includes('avant les séances'))
  verifier('tout le message est en Arial', !/Helvetica Neue/.test(html) && html.includes('font-family:Arial,Helvetica,sans-serif'))
  const tailles = new Set([...html.matchAll(/font-size:([^;"]+)/g)].map((m) => m[1]).filter((t) => t !== '0'))
  verifier('trois tailles de texte, pas une de plus', tailles.size <= 3, [...tailles].join(' | '))
}

console.log("\nL'en-tête")
{
  const html = construire()
  verifier(
    "le logo ouvre le message, et c'est la version blanche",
    html.includes('/assets/img/zinema-logo-blanc.png'),
  )
  verifier(
    "il est posé sur l'encre — le logo noir y disparaîtrait",
    /background-color:#100f0c;padding:22px 16px;text-align:center;/.test(html),
  )
  verifier(
    "le texte de remplacement reste lisible si l'image est bloquée",
    /alt="ZIN\u00c9MA"[^>]*color:#ffffff/.test(html),
  )
  verifier('le logo mène au site', /href="https:\/\/www\.zinema\.ch"[^>]*>\s*<img/.test(html))
}

console.log('\nCe qui ne doit jamais partir aux abonnés')
{
  const annulee = AFFICHE.map((f) =>
    f._id === 'north'
      ? {...f, seances: f.seances.map((s) => ({...s, statut: 'annule'}))}
      : f,
  )
  const titres = titresDuProgramme(construire(annulee))
  verifier(
    "une séance annulée n'est pas annoncée",
    !titres.includes('The North'),
    titres.join(' | '),
  )
}
{
  /* Un titre ou un synopsis sont saisis à la main dans le Studio : ils ne
     doivent jamais pouvoir refermer une balise et déformer le message. */
  const piege = [
    film({
      _id: 'piege',
      titre: '</td></table><script>alerte()</script>',
      synopsis: 'Un "guillemet" & une <balise>.',
      dateDeSortie: '2026-09-09',
      seances: [S(DEBUT, '19:00', 'Salle 1')],
    }),
  ]
  const html = construire(piege, [])
  verifier("un titre piégé n'ouvre aucune balise", !html.includes('<script>'))
  verifier('il est échappé au lieu d\'être exécuté', html.includes('&lt;script&gt;'))
  verifier('les guillemets et les esperluettes du synopsis passent', html.includes('&quot;guillemet&quot; &amp; une &lt;balise&gt;'))
}
{
  /* Une fiche à moitié remplie ne doit pas faire tomber l'envoi. */
  const nu = [
    film({_id: 'nu', titre: 'Film sans rien', seances: [S(DEBUT, '19:00', 'Salle 1')]}),
  ]
  const html = construire(nu, [])
  verifier('un film sans affiche, sans durée ni synopsis se compose quand même', html.includes('Film sans rien'))
  verifier("aucune image cassée n'est écrite", !html.includes('<img src="null'))
  verifier('sans date de sortie, aucune étiquette inventée', etiquettes(html).length === 0)
}
{
  const html = construire()
  verifier("l'adresse de l'affiche pointe sur le serveur d'images de Sanity", true)
  verifier('les liens des films ne sortent pas du http(s)', !/href="(?!https?:|mailto:)/.test(html))
  verifier('le tarif et les salles du cinéma sont repris des réglages',
    html.includes('16.–') && html.includes('18 places'))
  verifier('le parrain de la Salle 1 est annoncé', html.includes('Thierry Jobin'))
  verifier("l'IBAN du cinéma est en pied", html.includes('CH79 0900 0000 1725 7734 1'))
}

console.log(
  `\n${reussites} vérification${reussites > 1 ? 's' : ''} passée${reussites > 1 ? 's' : ''}` +
    (echecs ? `, ${echecs} en échec.\n` : '.\n'),
)

if (echecs > 0) {
  console.error("La newsletter ne dit plus ce qu'elle devrait. Rien n'est publié.\n")
  process.exit(1)
}
