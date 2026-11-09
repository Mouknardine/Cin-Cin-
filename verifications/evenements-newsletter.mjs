/* ============================================================
   Les événements dans la newsletter, vérifiés.

   Demande du cinéma (4 novembre 2026) : la newsletter doit tenir compte
   des dates des événements — premier et dernier jour, soirées notées,
   case « rappel » — et s'adapter toute seule.

   On vérifie ici, sur le VRAI code du Studio (evenements.ts,
   rendez-vous.ts, donnees.ts, gabarit.ts) et avec la VRAIE requête
   exécutée par groq-js (le moteur de Sanity) :
     1. quels événements la newsletter annonce ;
     2. la période écrite sous le titre quand aucune soirée n'est notée ;
     3. les soirées dans la grille du programme, et sur la feuille à
        imprimer.

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

const DOSSIER = '../sanity/plugins/planification/'
const {aLieuEntre, evenementsAnnonces, soireesEntre} = await chargerModule(`${DOSSIER}newsletter/evenements.ts`)
const {periodeEnClair} = await chargerModule(`${DOSSIER}newsletter/rendez-vous.ts`)
const {chargerNewsletter} = await chargerModule(`${DOSSIER}newsletter/donnees.ts`)
const {construireNewsletter} = await chargerModule(`${DOSSIER}newsletter/gabarit.ts`)
const {construireFeuille} = await chargerModule(`${DOSSIER}impression/feuille.ts`)

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

/* La newsletter de la semaine du mercredi 11 au mardi 17 novembre 2026 :
   elle part le lundi 9, et annonce aussi ce lundi et ce mardi. */
const DEBUT = '2026-11-11'
const FIN = '2026-11-17'
const ENVOI = '2026-11-09'

const evt = (o) => ({
  slug: o._id, typeNom: null, ancienType: null, resume: 'Résumé.', dateFin: null,
  imageRef: null, rendezVous: null, rappel: false, ...o,
})

const IMPRO = evt({
  _id: 'cosmic-impro', titre: 'Le Cosmic Impro Club', typeNom: 'Impro', dateDebut: '2026-11-12', dateFin: '2027-03-11',
  rendezVous: [
    {date: '2026-11-12', heure: '20:00', salle: 'Hall-Bar'},
    {date: '2026-12-10', heure: '20:00', salle: 'Hall-Bar'},
  ],
})
const CUMBIA = evt({_id: 'cumbia', titre: 'Cumbia del Zinema', typeNom: 'Soirée', dateDebut: '2026-11-14'})
const FESTIVAL = evt({_id: 'festival', titre: 'Festival du court', dateDebut: '2026-11-05', dateFin: '2026-11-22'})
const PLUS_TARD = evt({_id: 'plus-tard', titre: 'Ciné-club de décembre', dateDebut: '2026-12-06', rappel: true})
const TROP_LOIN = evt({_id: 'trop-loin', titre: 'Festival de printemps', dateDebut: '2027-03-01', rappel: true})
const SANS_RAPPEL = evt({_id: 'sans-rappel', titre: 'Brunch de décembre', dateDebut: '2026-12-06'})
const INFO = evt({_id: 'info', titre: 'Projections privées', dateDebut: '2026-01-01'})
const MATCH_PASSE = evt({
  _id: 'match-passe', titre: 'Match de la semaine dernière', rappel: true, dateDebut: '2026-10-01', dateFin: '2026-12-31',
  rendezVous: [{date: '2026-11-05', heure: '20:00', salle: 'Salle 1'}],
})

/* ------------------------------------------------------------------
   1. Quels événements la newsletter annonce
   ------------------------------------------------------------------ */
console.log('\nQuels événements la newsletter annonce')

verifier('une soirée notée dans la semaine : l’événement a lieu', aLieuEntre(IMPRO, ENVOI, FIN))
verifier('un seul jour, sans soirée notée, dans la semaine : il a lieu', aLieuEntre(CUMBIA, ENVOI, FIN))
verifier('une période qui chevauche la semaine : il a lieu', aLieuEntre(FESTIVAL, ENVOI, FIN))
verifier('une information sans dernier jour, commencée avant : non', aLieuEntre(INFO, ENVOI, FIN), false)
verifier(
  'ses soirées notées comptent plus que sa période',
  aLieuEntre({...IMPRO, rendezVous: [{date: '2026-12-10', heure: '20:00', salle: 'Hall-Bar'}]}, ENVOI, FIN),
  false,
)

const TOUS = [IMPRO, CUMBIA, FESTIVAL, PLUS_TARD, TROP_LOIN, SANS_RAPPEL, INFO, MATCH_PASSE]
verifier(
  'cette semaine, coché ou non, plus les rappels à moins de quatre semaines',
  evenementsAnnonces(TOUS, ENVOI, FIN).map((e) => e._id),
  ['cosmic-impro', 'cumbia', 'festival', 'plus-tard'],
)

/* ------------------------------------------------------------------
   2. La période, quand aucune soirée n'est notée
   ------------------------------------------------------------------ */
console.log('\nLa période sous le titre')

verifier('un seul jour', periodeEnClair(CUMBIA, ENVOI), 'samedi 14 novembre')
verifier('une période à venir', periodeEnClair({...FESTIVAL, dateDebut: '2026-11-12'}, ENVOI), 'Du jeudi 12 novembre au dimanche 22 novembre')
verifier('une période commencée : jusqu’à quand', periodeEnClair(FESTIVAL, ENVOI), "Jusqu'au dimanche 22 novembre")
verifier('une information commencée, sans fin : rien', periodeEnClair(INFO, ENVOI), null)
verifier('des soirées notées : pas de période, ce sont elles qu’on écrit', periodeEnClair(IMPRO, ENVOI), null)

/* ------------------------------------------------------------------
   3. Les soirées dans le programme, depuis Sanity
   ------------------------------------------------------------------ */
console.log('\nLes soirées dans le programme de la semaine')

verifier(
  'une soirée sans heure n’entre pas dans la grille',
  soireesEntre([evt({_id: 'x', titre: 'X', dateDebut: DEBUT, rendezVous: [{date: DEBUT, heure: null, salle: null}]})], DEBUT, FIN),
  [],
)

const DATASET = [
  {_type: 'film', _id: 'nuit', title: 'La Nuit', status: 'a-laffiche'},
  {_type: 'screening', _id: 's1', film: {_ref: 'nuit'}, date: '2026-11-12', time: '18:00', room: 'Salle 1', status: 'disponible'},
  {_type: 'screening', _id: 's2', film: {_ref: 'nuit'}, date: '2026-11-12', time: '20:30', room: 'Salle 1', status: 'disponible'},
  {_type: 'evenement', _id: 'cosmic-impro', title: 'Le Cosmic Impro Club', slug: {current: 'cosmic-impro'}, typeEvenement: 'Impro',
    dateDebut: '2026-11-12', dateFin: '2027-03-11', excerpt: 'Du théâtre improvisé.',
    rendezVous: [{_key: 'a', date: '2026-11-12', heure: '20:00', salle: 'Hall-Bar'}]},
  {_type: 'evenement', _id: 'lundi', title: 'Quiz du lundi', dateDebut: '2026-11-09', excerpt: 'Quiz.',
    rendezVous: [{_key: 'b', date: '2026-11-09', heure: '19:00', salle: 'Hall-Bar'}]},
  {_type: 'evenement', _id: 'cumbia', title: 'Cumbia del Zinema', dateDebut: '2026-11-14', excerpt: 'On danse.'},
  {_type: 'evenement', _id: 'info', title: 'Projections privées', dateDebut: '2026-01-01', excerpt: 'Louez la salle.'},
  {_type: 'evenement', _id: 'plus-tard', title: 'Ciné-club de décembre', rappelNewsletter: true, dateDebut: '2026-12-06', excerpt: 'Bientôt.'},
  {_type: 'evenement', _id: 'trop-loin', title: 'Festival de printemps', rappelNewsletter: true, dateDebut: '2027-03-01', excerpt: 'Loin.'},
  {_type: 'evenement', _id: 'fini', title: 'Ancien', dateDebut: '2026-01-01', dateFin: '2026-06-30', excerpt: 'Fini.'},
]
const chargees = await chargerNewsletter({fetch: (requete, params) => groq(requete, DATASET, params)}, DEBUT)

verifier(
  'la requête du Studio annonce les bons événements',
  chargees.rendezVous.map((e) => e._id),
  ['lundi', 'cosmic-impro', 'cumbia', 'plus-tard'],
)
/* La règle de la maison : à moins d'une demi-heure d'écart, c'est le même
   tour de séances, rangé Salle 1, Salle 2, puis Hall-Bar (sanity/salles.ts).
   La soirée de 20:00 au Hall-Bar suit donc la Salle 1 de 20:30. */
verifier(
  'la soirée d’impro prend sa place dans le programme du jeudi, comme une séance',
  chargees.programme.map((s) => `${s.heure} ${s.titre}`),
  ['18:00 La Nuit', '20:30 La Nuit', '20:00 Le Cosmic Impro Club'],
)
verifier(
  'avec son type en bandeau',
  chargees.programme.find((s) => s.titre === 'Le Cosmic Impro Club')?.particularite,
  'Impro',
)
verifier('le quiz du lundi de l’envoi passe en grisé, au-dessus', chargees.lundiEtMardi.map((s) => s.titre), ['Quiz du lundi'])
verifier('une soirée d’événement ne compte pas parmi les films de la semaine', chargees.filmsDeLaSemaine.map((f) => f._id), ['nuit'])

const html = construireNewsletter(chargees, {projectId: 'test', dataset: 'production'})
const grille = html.split('ACHETER UN BILLET')[0]
verifier(
  'dans la grille, le titre de la soirée mène à la page de l’événement',
  grille.includes('href="https://www.zinema.ch/evenements/?e=cosmic-impro"'),
)
verifier('et sa salle est écrite', /LE COSMIC IMPRO CLUB<\/a><\/td><td[^>]*>HALL-BAR</.test(grille))
const rubrique = html.split('>RENDEZ-VOUS<')[1] ?? ''
verifier('la rubrique « Rendez-vous » écrit la soirée de l’impro', rubrique.includes('JEUDI 12 NOVEMBRE · 20:00 · HALL-BAR'))
verifier('et le jour de la cumbia, faute de soirée notée', rubrique.includes('SAMEDI 14 NOVEMBRE'))
verifier('l’information sans date n’y est pas', !rubrique.includes('PROJECTIONS PRIVÉES'))

const feuille = construireFeuille(chargees, 'logo.png')
verifier(
  'la feuille à imprimer a la soirée aussi, son type après le titre',
  /Le Cosmic Impro Club, [^<]*<\/span><\/td><td class="salle">Hall-Bar/.test(feuille),
)

console.log(`\n${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
