/* ============================================================
   L'avant-première et la première, vérifiées.

   Le cinéma a demandé le 26 octobre 2026 de pouvoir écrire le jour
   ET l'heure d'une avant-première directement dans la fiche du film,
   une case « Première » distincte, et que la séance apparaisse toute
   seule dans le planning au lieu d'être refaite à la main.

   Quatre promesses sont tenues sous surveillance :

     1. publier la fiche crée la séance, une seule, même publiée dix
        fois — et reprend celle qu'on avait déjà posée à la main ;
     2. changer le jour, l'heure ou la salle dans la fiche déplace la
        séance, sans jamais toucher à une séance passée ;
     3. effacer l'horaire la retire ; changer de statut la rend
        ordinaire, sans la supprimer ;
     4. dans la Planification, elle reste à sa place : ni recalée, ni
        échangée lors d'un changement de salle ;
   et le site écrit le jour avec l'heure.

   Pour lancer :  npm test
   ============================================================ */
import {readFileSync} from 'node:fs'
import vm from 'node:vm'

import {build} from 'esbuild'

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

const {operationsPourLaFiche, projectionComplete} = await chargerModule(
  '../sanity/plugins/planification/utils/projection-de-la-fiche.ts',
)
const {recalagesNecessaires} = await chargerModule(
  '../sanity/plugins/planification/utils/enchainement.ts',
)
const {deplacementsPourChangerDeSalle} = await chargerModule(
  '../sanity/plugins/planification/utils/changement-de-salle.ts',
)

let echecs = 0
let reussites = 0

function verifier(intitule, obtenu, attendu) {
  if (JSON.stringify(obtenu) === JSON.stringify(attendu)) {
    reussites += 1
    console.log(`  ✓ ${intitule}`)
  } else {
    echecs += 1
    console.log(`  ✗ ${intitule}`)
    console.log(`      attendu : ${JSON.stringify(attendu)}`)
    console.log(`      obtenu  : ${JSON.stringify(obtenu)}`)
  }
}

const AUJOURDHUI = '2026-10-26'
const fiche = (champs = {}) => ({
  statut: 'avant-premiere',
  date: '2026-11-04',
  heure: '20:00',
  salle: 'Salle 1',
  ...champs,
})
const seance = (_id, date, heure, salle, evenement = null) => ({_id, date, heure, salle, evenement})

console.log('\nLa séance se crée à la publication de la fiche')

verifier(
  'une avant-première datée crée sa séance, marquée',
  operationsPourLaFiche(fiche(), [], AUJOURDHUI),
  [{type: 'creer', date: '2026-11-04', heure: '20:00', salle: 'Salle 1', evenement: 'avant-premiere'}],
)
verifier(
  'une première aussi, marquée « premiere »',
  operationsPourLaFiche(fiche({statut: 'premiere'}), [], AUJOURDHUI).map((o) => o.evenement),
  ['premiere'],
)
verifier(
  'republier une fiche inchangée ne crée rien de plus',
  operationsPourLaFiche(
    fiche(),
    [seance('ap', '2026-11-04', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [],
)
verifier(
  'une séance déjà posée à la main au même jour et à la même heure est reprise, pas doublée',
  operationsPourLaFiche(fiche({salle: 'Salle 2'}), [seance('main', '2026-11-04', '20:00', 'Salle 1')], AUJOURDHUI),
  [{type: 'modifier', id: 'main', date: '2026-11-04', heure: '20:00', salle: 'Salle 2', evenement: 'avant-premiere'}],
)
verifier(
  'les séances ordinaires du film, à d’autres horaires, ne sont pas touchées',
  operationsPourLaFiche(fiche(), [seance('autre', '2026-11-12', '19:00', 'Salle 1')], AUJOURDHUI).map(
    (o) => o.type,
  ),
  ['creer'],
)
verifier(
  'une date déjà passée ne recrée pas la séance à chaque publication',
  operationsPourLaFiche(
    fiche({date: '2026-10-01'}),
    [seance('ap', '2026-10-01', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [],
)

console.log('\nChanger la fiche déplace la séance')

verifier(
  'nouvelle heure, nouvelle salle : la séance suit',
  operationsPourLaFiche(
    fiche({heure: '18:30', salle: 'Hall-Bar'}),
    [seance('ap', '2026-11-04', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [{type: 'modifier', id: 'ap', date: '2026-11-04', heure: '18:30', salle: 'Hall-Bar', evenement: 'avant-premiere'}],
)
verifier(
  'passer d’avant-première à première garde la séance et change sa marque',
  operationsPourLaFiche(
    fiche({statut: 'premiere'}),
    [seance('ap', '2026-11-04', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [{type: 'modifier', id: 'ap', date: '2026-11-04', heure: '20:00', salle: 'Salle 1', evenement: 'premiere'}],
)
verifier(
  'une avant-première passée n’est jamais déplacée : la nouvelle date a sa propre séance',
  operationsPourLaFiche(
    fiche({date: '2026-12-02'}),
    [seance('passee', '2026-10-07', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [{type: 'creer', date: '2026-12-02', heure: '20:00', salle: 'Salle 1', evenement: 'avant-premiere'}],
)

console.log('\nEffacer l’horaire, changer de statut')

verifier(
  'jour effacé : la séance annoncée est retirée',
  operationsPourLaFiche(
    fiche({date: null}),
    [seance('ap', '2026-11-04', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [{type: 'supprimer', id: 'ap'}],
)
verifier(
  'heure effacée : idem',
  operationsPourLaFiche(
    fiche({heure: ''}),
    [seance('ap', '2026-11-04', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [{type: 'supprimer', id: 'ap'}],
)
verifier(
  'le film passe à l’affiche : sa séance reste, redevenue ordinaire',
  operationsPourLaFiche(
    fiche({statut: 'a-laffiche'}),
    [seance('ap', '2026-11-04', '20:00', 'Salle 1', 'avant-premiere')],
    AUJOURDHUI,
  ),
  [{type: 'detacher', id: 'ap'}],
)
verifier(
  'un film ordinaire sans séance marquée ne produit rien',
  operationsPourLaFiche(
    fiche({statut: 'a-laffiche'}),
    [seance('s', '2026-11-04', '20:00', 'Salle 1')],
    AUJOURDHUI,
  ),
  [],
)
verifier(
  'une heure mal écrite ne programme rien',
  [projectionComplete(fiche({heure: '20h'})), projectionComplete(fiche({heure: '20:00'}))],
  [false, true],
)
verifier(
  'sans salle, rien n’est programmé',
  projectionComplete(fiche({salle: null})),
  false,
)

console.log('\nDans la Planification, elle reste à sa place')

const MERCREDI = '2026-11-04'
const enGrille = (_id, filmId, heure, salle, filmDuree, evenement = null) => ({
  _id,
  date: MERCREDI,
  heure,
  salle,
  filmId,
  filmTitre: filmId,
  filmDuree,
  evenement,
})

verifier(
  'derrière un long film, une séance ordinaire de 21 h est recalée…',
  recalagesNecessaires([
    enGrille('long', 'A', '19:00', 'Salle 1', 140),
    enGrille('apres', 'B', '21:00', 'Salle 1', 90),
  ]).map((r) => r.id),
  ['apres'],
)
verifier(
  '… mais pas une avant-première : son heure est celle annoncée',
  recalagesNecessaires([
    enGrille('long', 'A', '19:00', 'Salle 1', 140),
    enGrille('ap', 'B', '21:00', 'Salle 1', 90, 'avant-premiere'),
  ]),
  [],
)
verifier(
  'changer un film de salle n’échange pas sa place avec une avant-première',
  deplacementsPourChangerDeSalle(
    [enGrille('a', 'A', '19:00', 'Salle 1', 90), enGrille('ap', 'B', '19:00', 'Salle 2', 90, 'premiere')],
    'A',
    'Salle 2',
  ),
  [],
)
verifier(
  'et l’avant-première elle-même ne déménage pas avec son film',
  deplacementsPourChangerDeSalle(
    [enGrille('ap', 'B', '19:00', 'Salle 1', 90, 'avant-premiere')],
    'B',
    'Salle 2',
  ),
  [],
)

console.log('\nLe site écrit le jour avec l’heure')

const fenetre = vm.createContext({console})
fenetre.window = fenetre
fenetre.addEventListener = () => undefined
fenetre.ZinemaData = {projectId: 'test', dataset: 'test'}
vm.runInContext(readFileSync(new URL('../assets/js/render.js', import.meta.url), 'utf8'), fenetre)
const R = fenetre.ZinemaRender
const annee = new Date().getFullYear()

verifier(
  'en long : « mercredi 4 novembre, 20:00 »',
  R.formatRendezVous(`${annee}-11-04`, '20:00').replace(/^\S+ /, 'JOUR '),
  'JOUR 4 novembre, 20:00',
)
verifier('en court : « 4 novembre, 20:00 »', R.formatRendezVous(`${annee}-11-04`, '20:00', true), '4 novembre, 20:00')
verifier('sans heure, le jour seul', R.formatRendezVous(`${annee}-11-04`, '', true), '4 novembre')
verifier('sans jour, rien', R.formatRendezVous('', '20:00'), '')
verifier(
  'deux filtres distincts sur la page Films : Avant-première, puis Première',
  R.filtresFilms.map((f) => `${f.statut}=${f.label}`).slice(1, 3),
  ['avant-premiere=Avant-première', 'premiere=Première'],
)
verifier('« premiere » se lit « Première »', R.statusLabel('premiere'), 'Première')

console.log(`\n${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
