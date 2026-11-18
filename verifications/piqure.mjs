/* ============================================================
   La piqûre de rappel, vérifiée.

   Demande du cinéma (18 novembre 2026) : une petite newsletter en
   cours de semaine, en plus de celle du lundi, pour mettre en avant un
   film ou un événement — « comme les deux films japonais de vendredi
   (en présence du réalisateur), ou bientôt notre Marché de Noël ».

   On vérifie ici, sur le VRAI code du Studio (newsletter/piqure/) et
   avec la VRAIE requête exécutée par groq-js (le moteur de Sanity) :
     1. ce que la piqûre propose de cocher, et dans quel ordre ;
     2. ce que la liste dit de chaque film et de chaque événement ;
     3. le message composé : titre, mot, blocs, bouton, pied ;
     4. qu'une séance en cours d'édition ne s'annonce qu'une fois,
        dans la piqûre comme dans la newsletter du lundi.

   Pour lancer :  npm test
   ============================================================ */
import {build} from 'esbuild'
import {evaluate, parse} from 'groq-js'

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

const DOSSIER = '../sanity/plugins/planification/newsletter/'
const {chargerPiqure, envoiParDefaut} = await chargerModule(`${DOSSIER}piqure/candidats.ts`)
const {construirePiqure, objetDeLaPiqure, titreParDefaut} = await chargerModule(`${DOSSIER}piqure/gabarit.ts`)
const {resumeDeLEvenement, resumeDuFilm} = await chargerModule(`${DOSSIER}piqure/resumes.ts`)
const {chargerNewsletter} = await chargerModule(`${DOSSIER}donnees.ts`)

let echecs = 0
let reussites = 0

function verifier(intitule, obtenu, attendu = true) {
  if (JSON.stringify(obtenu) === JSON.stringify(attendu)) {
    reussites += 1
    console.log(`  ✓ ${intitule}`)
    return
  }
  echecs += 1
  console.error(`  ✗ ${intitule}\n    attendu : ${JSON.stringify(attendu)}\n    obtenu  : ${JSON.stringify(obtenu)}`)
}

async function groq(requete, dataset, params) {
  return (await evaluate(parse(requete, {params}), {dataset, params})).get()
}

/* La piqûre part le mercredi 18 novembre 2026. */
const ENVOI = '2026-11-18'
const PROJET = {projectId: 'test', dataset: 'production'}

const seance = (_id, film, date, time, o = {}) => ({
  _type: 'screening', _id, film: {_ref: film}, date, time, room: 'Salle 1', status: 'disponible', ...o,
})

const DATASET = [
  {_type: 'film', _id: 'asako', title: 'Asako I & II', slug: {current: 'asako'}, status: 'a-laffiche',
    presence: 'Ryusuke Hamaguchi', presenceDate: '2026-11-20', synopsis: 'Une histoire.'},
  /* Le brouillon d'un film n'a pas de séance : il ne doit pas passer. */
  {_type: 'film', _id: 'drafts.asako', title: 'Asako (brouillon)', status: 'a-laffiche'},
  {_type: 'film', _id: 'drive', title: 'Drive My Car', slug: {current: 'drive'}, status: 'a-laffiche'},
  {_type: 'film', _id: 'reprise', title: 'Reprise du dimanche', slug: {current: 'reprise'}, status: 'passe'},
  {_type: 'film', _id: 'avant', title: 'La Première', slug: {current: 'avant'}, status: 'prochainement', releaseDate: '2026-12-09'},
  {_type: 'film', _id: 'loin', title: 'Trop loin', status: 'prochainement'},
  {_type: 'film', _id: 'fini', title: 'Déjà passé', status: 'a-laffiche'},

  seance('a1', 'asako', '2026-11-19', '18:00'),
  seance('a2', 'asako', '2026-11-20', '20:00'),
  seance('a3', 'asako', '2026-11-21', '21:00', {status: 'annule'}),
  seance('a4', 'asako', '2026-11-24', '19:00'),
  /* Le huitième jour après l'envoi : hors des pastilles. */
  seance('a5', 'asako', '2026-11-26', '19:00'),
  /* Une séance en cours d'édition : publiée, et son brouillon avec une mention. */
  seance('d1', 'drive', '2026-11-20', '21:30', {room: 'Salle 2'}),
  seance('drafts.d1', 'drive', '2026-11-20', '21:30', {room: 'Salle 2', versionNote: 'Suivie d’un apéro'}),
  seance('r1', 'reprise', '2026-11-22', '17:00'),
  /* Une avant-première dans deux semaines : ses pastilles partent d'elle. */
  seance('p1', 'avant', '2026-12-02', '20:00', {evenementDuFilm: 'avant-premiere'}),
  seance('p2', 'avant', '2026-12-05', '18:00'),
  seance('p3', 'avant', '2026-12-10', '18:00'),
  seance('l1', 'loin', '2027-02-01', '20:00'),
  seance('f1', 'fini', '2026-11-10', '20:00'),

  {_type: 'evenement', _id: 'noel', title: 'Marché de Noël', slug: {current: 'marche-de-noel'}, typeEvenement: 'Marché',
    dateDebut: '2026-12-12', dateFin: '2026-12-13', excerpt: 'Le marché.'},
  {_type: 'evenement', _id: 'drafts.noel', title: 'Marché de Noël du Zinéma', slug: {current: 'marche-de-noel'}, typeEvenement: 'Marché',
    dateDebut: '2026-12-12', dateFin: '2026-12-13', excerpt: 'Artisans, vin chaud et courts métrages.'},
  {_type: 'evenement', _id: 'festival', title: 'Festival du court', slug: {current: 'festival'},
    dateDebut: '2026-11-01', dateFin: '2026-11-30', excerpt: 'Des courts.'},
  {_type: 'evenement', _id: 'impro', title: 'Le Cosmic Impro Club', slug: {current: 'impro'}, typeEvenement: 'Impro',
    dateDebut: '2026-11-01', dateFin: '2027-03-11', excerpt: 'De l’impro.',
    rendezVous: [{_key: 'a', date: '2026-11-12', heure: '20:00', salle: 'Hall-Bar'}, {_key: 'b', date: '2026-12-10', heure: '20:00', salle: 'Hall-Bar'}]},
  {_type: 'evenement', _id: 'info', title: 'Projections privées', dateDebut: '2026-01-01', excerpt: 'Louez la salle.'},
  {_type: 'evenement', _id: 'printemps', title: 'Festival de printemps', dateDebut: '2027-03-01', excerpt: 'Loin.'},

  {_type: 'siteSettings', _id: 'reglages', phone: '026 000 00 00', email: 'info@zinema.ch', tarifPlein: 15},
  {_type: 'abonnements', _id: 'abonnements', iban: 'CH00 0000 0000 0000 0000 0'},
]
const client = {fetch: (requete, params) => groq(requete, DATASET, params)}

/* ------------------------------------------------------------------
   1. Ce que la piqûre propose
   ------------------------------------------------------------------ */
console.log('\nCe que la piqûre propose de cocher')

verifier('à l’ouverture : aujourd’hui', envoiParDefaut('2026-11-11', ENVOI), ENVOI)
verifier('ou le mercredi de la semaine affichée, si elle est à venir', envoiParDefaut('2026-11-25', ENVOI), '2026-11-25')

const donnees = await chargerPiqure(client, ENVOI)
const film = (id) => donnees.films.find((choix) => choix.film._id === id)
const evenement = (cle) => donnees.evenements.find((choix) => choix.cle === cle)

verifier(
  'les films qui passent d’ici huit semaines, le plus proche d’abord — un film retiré de l’affiche compris',
  donnees.films.map((choix) => choix.film.titre),
  ['Asako I & II', 'Drive My Car', 'Reprise du dimanche', 'La Première'],
)
verifier(
  'les pastilles couvrent les sept jours de l’envoi, sans la séance annulée',
  film('asako').pastilles.map((s) => `${s.date} ${s.heure}`),
  ['2026-11-19 18:00', '2026-11-20 20:00', '2026-11-24 19:00'],
)
verifier('le huitième jour reste dans ses séances, pour les bandeaux', film('asako').seances.length, 4)
verifier(
  'un film qui ne passe que dans deux semaines montre les sept jours de sa première séance',
  film('avant').pastilles.map((s) => s.date),
  ['2026-12-02', '2026-12-05'],
)
verifier('une séance en cours d’édition ne compte qu’une fois, par son brouillon', film('drive').seances.map((s) => s.mention), ['Suivie d’un apéro'])
verifier(
  'les événements d’ici huit semaines, le plus proche d’abord',
  donnees.evenements.map((choix) => choix.cle),
  ['evenement:festival', 'evenement:impro', 'evenement:noel'],
)
verifier('un événement en cours de modification passe par son brouillon', evenement('evenement:noel').evenement.titre, 'Marché de Noël du Zinéma')
verifier('un festival déjà commencé se range au jour de l’envoi', evenement('evenement:festival').date, ENVOI)
verifier('un rendez-vous qui revient se range à sa prochaine soirée', evenement('evenement:impro').date, '2026-12-10')
verifier('les réglages du cinéma sont lus pour le pied', donnees.reglages.iban, 'CH00 0000 0000 0000 0000 0')

/* ------------------------------------------------------------------
   2. Ce que la liste dit de chacun
   ------------------------------------------------------------------ */
console.log('\nCe que la liste dit de chacun')

verifier('un film : sa prochaine séance, et combien en sept jours', resumeDuFilm(film('asako')).prochaine, 'Prochaine séance : jeudi 19 novembre à 18:00 ·\u00a03\u00a0séances\u00a0en\u00a07\u00a0jours')
verifier('et sa séance spéciale, mise en valeur', resumeDuFilm(film('asako')).speciale, 'Vendredi 20 novembre à 20:00 — En présence de Ryusuke Hamaguchi')
verifier('un film sans séance spéciale n’en invente pas', resumeDuFilm(film('reprise')).speciale, null)
verifier('un événement : son type et sa période', resumeDeLEvenement(evenement('evenement:noel'), ENVOI), 'Marché · du samedi 12 décembre au dimanche 13 décembre')
verifier('un rendez-vous : sa prochaine soirée', resumeDeLEvenement(evenement('evenement:impro'), ENVOI), 'Impro · jeudi 10 décembre à 20:00 · Hall-Bar')
verifier('un festival commencé : jusqu’à quand', resumeDeLEvenement(evenement('evenement:festival'), ENVOI), "Jusqu'au lundi 30 novembre")

/* ------------------------------------------------------------------
   3. Le message composé
   ------------------------------------------------------------------ */
console.log('\nLe message composé')

const NOEL = evenement('evenement:noel')
const choix = [NOEL, film('drive'), film('asako')]
verifier('rien de coché : pas de message', construirePiqure({envoi: ENVOI, titre: '', mot: '', choix: [], reglages: donnees.reglages}, PROJET), '')
verifier('le titre proposé : les noms cochés, le plus proche d’abord', titreParDefaut(choix), 'Asako I & II, Drive My Car et Marché de Noël du Zinéma')
verifier('à deux, sans virgule', titreParDefaut([NOEL, film('asako')]), 'Asako I & II et Marché de Noël du Zinéma')
verifier('l’objet, en capitales', objetDeLaPiqure('', [film('asako')]), 'ASAKO I & II')
verifier('un titre écrit remplace celui qui est proposé', objetDeLaPiqure('  Ce vendredi au Zinéma ', choix), 'CE VENDREDI AU ZINÉMA')

const html = construirePiqure(
  {envoi: ENVOI, titre: '', mot: 'Le réalisateur sera là.\n\n<b>Venez</b> nombreux.', choix, reglages: donnees.reglages},
  PROJET,
)
const position = (texte) => html.indexOf(texte)
verifier('le logo du Zinéma en tête', html.includes('zinema-logo.png'))
verifier('la case bleue porte le titre', html.includes('>ASAKO I &amp; II, DRIVE MY CAR ET MARCHÉ DE NOËL DU ZINÉMA</td>'))
verifier('le mot du cinéma, échappé', html.includes('&lt;b&gt;Venez&lt;/b&gt; nombreux.') && !html.includes('<b>Venez'))
verifier(
  'les blocs dans l’ordre des dates',
  position('>ASAKO I &amp; II</a>') < position('>DRIVE MY CAR</a>') && position('>DRIVE MY CAR</a>') < position('>MARCHÉ DE NOËL DU ZINÉMA</a>'),
)
verifier('la séance spéciale en bandeau, le jour en toutes lettres', html.includes('VENDREDI 20 NOVEMBRE · 20:00&nbsp;— EN PRÉSENCE DE RYUSUKE HAMAGUCHI'))
verifier('la mention de la séance en cours d’édition, une seule fois', html.split('SUIVIE D’UN APÉRO').length - 1, 1)
verifier('les pastilles des sept jours', ['JEU&nbsp;19', 'VEN&nbsp;20', 'MAR&nbsp;24'].every((pastille) => html.includes(pastille)))
verifier('pas celle du huitième jour', html.includes('JEU&nbsp;26'), false)
verifier('l’étiquette du film compte ses semaines', html.includes('1ÈRE SEMAINE'))
verifier('le Marché de Noël mène à sa page', html.includes('href="https://www.zinema.ch/evenements/?e=marche-de-noel"'))
verifier('un film coché : le bouton pour acheter un billet', html.includes('ACHETER UN BILLET SUR'))
verifier('le pied du cinéma', html.includes('fondée en juin 2001') && html.includes('IBAN CH00'))
verifier(
  'ni programme de la semaine, ni « Prochainement », ni tarifs',
  ['PROGRAMME DU', '>PROCHAINEMENT<', '>INFOS<', 'Tarif ordinaire', '>RENDEZ-VOUS<'].filter((morceau) => html.includes(morceau)),
  [],
)

const avantPremiere = construirePiqure({envoi: ENVOI, titre: '', mot: '', choix: [film('avant')], reglages: donnees.reglages}, PROJET)
verifier('une avant-première annonce la sortie du film', avantPremiere.includes('SORTIE LE MERCREDI 9 DÉCEMBRE'))
verifier('et son bandeau, en toutes lettres', avantPremiere.includes('MERCREDI 2 DÉCEMBRE · 20:00&nbsp;— AVANT-PREMIÈRE'))

const seulementNoel = construirePiqure({envoi: ENVOI, titre: '', mot: '', choix: [NOEL], reglages: donnees.reglages}, PROJET)
verifier('un événement seul : pas de bouton vert, il ne vend pas de billet', seulementNoel.includes('ACHETER UN BILLET'), false)
verifier('un titre écrit passe dans la case bleue', construirePiqure({envoi: ENVOI, titre: 'Ce samedi', mot: '', choix: [NOEL], reglages: donnees.reglages}, PROJET).includes('>CE SAMEDI</td>'))

/* ------------------------------------------------------------------
   4. La newsletter du lundi profite du même tri des séances
   ------------------------------------------------------------------ */
console.log('\nLa newsletter du lundi')

const semaine = await chargerNewsletter(client, ENVOI)
verifier(
  'une séance en cours d’édition ne passe qu’une fois dans le programme, avec sa mention',
  semaine.programme.filter((s) => s.titre === 'Drive My Car').map((s) => s.particularite),
  ['Suivie d’un apéro'],
)

console.log(`\n${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
