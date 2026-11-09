/* ============================================================
   Les demandes du cinéma du 3 novembre 2026, vérifiées.

     1. « Où en est ce film ? » se coche en plusieurs cases — sauf
        « Terminé », seul. Le film est dans chaque rubrique cochée, et
        une projection datée la quitte le lendemain si une autre case
        est cochée. Le Studio (statutsDuJour) et le site (etatDuJour,
        dans assets/js/data.js) doivent dire la même chose, jour après
        jour.
     2. Les séances spéciales — avant-première, invité·e, mention
        particulière — se lisent dans la newsletter de la semaine et
        sur la feuille à imprimer.
     3. La piqûre de rappel : un événement qui revient (match d'impro)
        est rappelé dans la newsletter avec ses prochaines dates, et
        disparaît tout seul quand elles sont passées.

   Les requêtes GROQ sont exécutées pour de vrai, par groq-js (le
   moteur de requêtes de Sanity), sur un petit jeu de données.

   Pour lancer :  npm test
   ============================================================ */
import {readFileSync} from 'node:fs'
import vm from 'node:vm'

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

const {basculer, groqCoche, statutPrincipal, statutPrincipalDuJour, statutsDe, statutsDuJour} = await chargerModule(
  '../sanity/plugins/planification/utils/etats-du-film.ts',
)
const {particulariteDeLaSeance, texteParticularite} = await chargerModule(
  '../sanity/plugins/planification/newsletter/particularite.ts',
)
const {construireNewsletter} = await chargerModule('../sanity/plugins/planification/newsletter/gabarit.ts')
const {chargerNewsletter, programmeEntre} = await chargerModule(
  '../sanity/plugins/planification/newsletter/donnees.ts',
)
const {rendezVousARappeler, prochainesDates} = await chargerModule(
  '../sanity/plugins/planification/newsletter/rendez-vous.ts',
)
const {construireFeuille, tientSurUnePage} = await chargerModule(
  '../sanity/plugins/planification/impression/feuille.ts',
)

let echecs = 0
let reussites = 0

function verifier(intitule, obtenu, attendu = true) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (ok) {
    reussites += 1
    console.log(`  ✓ ${intitule}`)
    return
  }
  echecs += 1
  console.error(`  ✗ ${intitule}\n    attendu : ${JSON.stringify(attendu)}\n    obtenu  : ${JSON.stringify(obtenu)}`)
}

async function groq(requete, dataset, params) {
  const resultat = await evaluate(parse(requete, {params}), {dataset, params})
  return resultat.get()
}

/* ------------------------------------------------------------------
   1. Plusieurs cases à la fois
   ------------------------------------------------------------------ */
console.log('\nOù en est ce film ? Plusieurs cases à la fois')

verifier('cocher À l’affiche après Première garde les deux', basculer(['premiere'], 'a-laffiche'), ['a-laffiche', 'premiere'])
verifier('cocher Terminé décoche tout le reste', basculer(['premiere', 'a-laffiche'], 'passe'), ['passe'])
verifier('cocher une autre case décoche Terminé', basculer(['passe'], 'prochainement'), ['prochainement'])
verifier(
  'avant-première et première s’excluent (un seul jour de projection)',
  basculer(['avant-premiere', 'a-laffiche'], 'premiere'),
  ['a-laffiche', 'premiere'],
)
verifier('décocher une case la retire', basculer(['premiere', 'a-laffiche'], 'premiere'), ['a-laffiche'])
verifier('l’état principal est la projection datée', statutPrincipal(['a-laffiche', 'premiere']), 'premiere')
verifier('une fiche d’avant le 3 novembre se lit encore', statutsDe({status: 'cycle'}), ['cycle'])

/* La règle du site, exécutée telle quelle depuis assets/js/data.js. */
const fenetreSite = {console, fetch: () => Promise.reject(new Error('hors ligne'))}
fenetreSite.window = fenetreSite
vm.createContext(fenetreSite)
vm.runInContext(readFileSync(new URL('../assets/js/data.js', import.meta.url), 'utf8'), fenetreSite)
const ZD = fenetreSite.ZinemaData

const FICHES = [
  {_id: 'ap-et-affiche', status: 'avant-premiere', statuts: ['a-laffiche', 'avant-premiere'], projectionDate: '2026-11-04'},
  {_id: 'premiere-et-bientot', status: 'premiere', statuts: ['premiere', 'prochainement'], projectionDate: '2026-11-04', releaseDate: '2026-11-18'},
  {_id: 'ap-seule', status: 'avant-premiere', statuts: ['avant-premiere'], projectionDate: '2026-11-04'},
  {_id: 'ancienne-fiche', status: 'prochainement', releaseDate: '2026-11-11'},
  {_id: 'cycle-et-affiche', status: 'a-laffiche', statuts: ['a-laffiche', 'cycle']},
  {_id: 'termine', status: 'passe', statuts: ['passe']},
]

const ATTENDU = {
  '2026-11-04': [['a-laffiche', 'avant-premiere'], ['premiere', 'prochainement'], ['avant-premiere'], ['prochainement'], ['a-laffiche', 'cycle'], ['passe']],
  '2026-11-05': [['a-laffiche'], ['prochainement'], ['avant-premiere'], ['prochainement'], ['a-laffiche', 'cycle'], ['passe']],
  '2026-11-18': [['a-laffiche'], ['a-laffiche'], ['avant-premiere'], ['a-laffiche'], ['a-laffiche', 'cycle'], ['passe']],
}

for (const [jour, attendus] of Object.entries(ATTENDU)) {
  verifier(`le ${jour}, le Studio range chaque film dans ses rubriques`, FICHES.map((f) => statutsDuJour(f, jour)), attendus)
  const site = ZD.etatDuJour(structuredClone(FICHES), jour)
  verifier(`le ${jour}, le site dit la même chose`, site.map((f) => [...f.statuts]), attendus)
  verifier(
    `le ${jour}, et le même état principal`,
    site.map((f) => f.status),
    FICHES.map((f) => statutPrincipalDuJour(f, jour)),
  )
}

const DATASET_FILMS = FICHES.map((f) => ({_type: 'film', ...f}))
verifier(
  'en GROQ, une case cochée se retrouve, ancienne fiche comprise',
  await groq(`*[_type == "film" && ${groqCoche('prochainement')}]._id`, DATASET_FILMS, {}),
  ['premiere-et-bientot', 'ancienne-fiche'],
)

/* ------------------------------------------------------------------
   2. Les séances spéciales
   ------------------------------------------------------------------ */
console.log('\nLes séances spéciales')

const invite = {presence: 'la réalisatrice Jeanne Dupont', presenceDate: '2026-11-06'}
verifier(
  'une avant-première avec invitée et rencontre se lit en une ligne',
  texteParticularite(
    particulariteDeLaSeance({date: '2026-11-06', projection: 'avant-premiere', mention: 'Suivie d’une rencontre'}, invite),
  ),
  'Avant-première · En présence de la réalisatrice Jeanne Dupont · Suivie d’une rencontre',
)
verifier(
  "l'invitée n'est annoncée que le jour où elle vient",
  texteParticularite(particulariteDeLaSeance({date: '2026-11-07'}, invite)),
  null,
)
verifier(
  'sans jour dans la fiche, elle est là à toutes les séances',
  texteParticularite(particulariteDeLaSeance({date: '2026-11-07'}, {presence: "l'équipe du film"})),
  "En présence de l'équipe du film",
)
verifier(
  'une mention qui redit la projection ne se répète pas',
  texteParticularite(particulariteDeLaSeance({date: '2026-11-06', projection: 'premiere', mention: 'Première'}, {})),
  'Première',
)

const DEBUT = '2026-11-04'
const FIN = '2026-11-10'
const S = (date, heure, salle, plus = {}) => ({date, heure, salle, statut: 'disponible', ...plus})
const film = (o) => ({
  typeDeFilm: null, genres: [], realisation: null, pays: null, annee: null, duree: null,
  version: null, sousTitres: null, age: null, synopsis: null, dateDeSortie: null,
  premiereProjection: null, statut: 'a-laffiche', bandeAnnonce: null, presse: null, afficheRef: null,
  presence: null, presenceDate: null, seances: [], slug: o._id, ...o,
})
const FILMS = [
  film({
    _id: 'nuit', titre: 'La Nuit', ...invite, premiereProjection: DEBUT,
    seances: [S('2026-11-06', '20:00', 'Salle 1', {projection: 'avant-premiere'}), S('2026-11-07', '19:00', 'Salle 1')],
  }),
  film({_id: 'jour', titre: 'Le Jour', premiereProjection: DEBUT, seances: [S('2026-11-05', '21:00', 'Salle 2')]}),
]
const AVENIR = [
  film({
    _id: 'demain', titre: 'Demain', statut: 'premiere',
    seances: [S('2026-11-20', '20:00', 'Salle 1', {projection: 'premiere', mention: 'Suivie d’un apéro'})],
  }),
]
const programme = programmeEntre(FILMS, DEBUT, FIN)
const MATCH = {
  _id: 'impro', titre: "Match d'impro", slug: 'match-impro', typeNom: 'Spectacle', ancienType: null,
  resume: 'Deux équipes, un arbitre, le public vote.', dateDebut: '2026-09-01', dateFin: '2027-06-30', imageRef: null,
  rendezVous: [
    {date: '2026-10-02', heure: '20:00', salle: 'Hall-Bar'},
    {date: '2026-12-04', heure: '20:00', salle: 'Hall-Bar'},
    {date: '2026-11-06', heure: '20:00', salle: 'Hall-Bar'},
    {date: '2027-01-08', heure: '20:00', salle: 'Hall-Bar'},
    {date: '2027-02-05', heure: '20:00', salle: 'Hall-Bar'},
  ],
}
const MATCH_FINI = {...MATCH, _id: 'fini', titre: 'Saison passée', rendezVous: [{date: '2026-10-02', heure: '20:00', salle: 'Hall-Bar'}]}
const SANS_DATE = {...MATCH, _id: 'libre', titre: 'Ciné-club', rendezVous: null}

const donnees = {
  debutSemaine: DEBUT, finSemaine: FIN, programme,
  lundiEtMardi: [], filmsDeLaSemaine: FILMS, filmsAVenir: AVENIR,
  rendezVous: [MATCH, MATCH_FINI, SANS_DATE],
  reglages: {adresse: null, telephone: null, telephoneBis: null, email: null, tarifPlein: null, tarifReduit: null, conditionsReduit: null, salles: null, iban: null},
}
const html = construireNewsletter(donnees, {projectId: 'test', dataset: 'production'})
const grille = html.split('ACHETER UN BILLET')[0]
verifier(
  'dans la grille de la semaine, la séance spéciale a son bandeau noir juste dessous',
  /SALLE 1<\/td><\/tr><tr><td colspan="3" style="[^"]*background-color:#100f0c;color:#ffffff;[^"]*">AVANT-PREMIÈRE · EN PRÉSENCE DE LA RÉALISATRICE JEANNE DUPONT<\/td>/.test(grille),
)
verifier("une séance ordinaire du même film n'en a pas", (grille.match(/EN PRÉSENCE DE/g) ?? []).length, 1)
const blocs = html.split('ACHETER UN BILLET')[1]
verifier(
  'le bloc du film rappelle la séance spéciale, en bandeau noir, avec son jour et son heure',
  /background-color:#100f0c;color:#ffffff;[^"]*">VEN 6 · 20:00&nbsp;— AVANT-PREMIÈRE · EN PRÉSENCE DE LA RÉALISATRICE JEANNE DUPONT<\/td>/.test(blocs),
)
const pastillesNuit = [...blocs.split('>LA NUIT<')[1].split('>LE JOUR<')[0].matchAll(/<td nowrap style="([^"]*)"/g)].map((m) => m[1])
verifier(
  'sa pastille est inversée, et elle seule',
  pastillesNuit.map((style) => style.includes('background-color:#100f0c;')),
  [true, false],
)
verifier(
  'un film à venir annonce sa première, jour en toutes lettres',
  blocs.includes('VENDREDI 20 NOVEMBRE · 20:00&nbsp;— PREMIÈRE · SUIVIE D’UN APÉRO'),
)

const feuille = construireFeuille({debutSemaine: DEBUT, finSemaine: FIN, programme, lundiEtMardi: []}, 'logo.png')
verifier(
  'la feuille à imprimer met la mention dans la case du titre, après une virgule',
  /<tr class="seance double"><td class="heure">[^<]*<\/td><td class="titre"><span class="titre-long">La Nuit, Avant-première · En présence de la réalisatrice Jeanne Dupont<\/span><\/td>/.test(feuille),
)
verifier('plus de bandeau noir séparé', !feuille.includes('<tr class="special">'))
verifier('la case prend deux lignes de hauteur', /tr\.double td \{[^}]*height: [\d.]+mm;/.test(feuille))
verifier('et la feuille tient toujours sur une page', tientSurUnePage(programme, []))
const chargee = Array.from({length: 7}, (_, j) =>
  ['19:00', '19:00', '21:00', '21:00', '17:00'].map((heure, i) => ({
    date: `2026-11-${String(4 + j).padStart(2, '0')}`, heure, salle: i % 2 ? 'Salle 2' : 'Salle 1',
    statut: 'disponible', titre: 'Un film', filmId: 'f', slug: 'f', particularite: i === 0 ? 'En présence de l’équipe' : null,
  })),
).flat()
verifier('une semaine chargée de séances spéciales tient encore sur une page', tientSurUnePage(chargee, []))

/* ------------------------------------------------------------------
   3. La piqûre de rappel
   ------------------------------------------------------------------ */
console.log('\nLa piqûre de rappel des événements qui reviennent')

const envoi = '2026-11-02'
verifier(
  'les trois prochaines dates, dans l’ordre, sans les passées',
  prochainesDates(MATCH, envoi).map((rdv) => rdv.date),
  ['2026-11-06', '2026-12-04', '2027-01-08'],
)
verifier(
  'un événement dont toutes les dates sont passées n’est plus rappelé',
  rendezVousARappeler([MATCH, MATCH_FINI, SANS_DATE], envoi).map((e) => e._id),
  ['impro', 'libre'],
)
const rubrique = html.split('>RENDEZ-VOUS<')[1] ?? ''
verifier('la newsletter a sa rubrique « Rendez-vous »', rubrique !== '')
verifier('entre les films de la semaine et Prochainement', html.indexOf('>RENDEZ-VOUS<') > html.indexOf('>LES FILMS DE LA SEMAINE<') && html.indexOf('>RENDEZ-VOUS<') < html.indexOf('>PROCHAINEMENT<'))
verifier('avec la prochaine date du match', rubrique.includes('VENDREDI 6 NOVEMBRE · 20:00 · HALL-BAR'))
verifier('et un lien vers sa page', rubrique.includes('https://www.zinema.ch/evenements/?e=match-impro'))
verifier('la saison passée n’y est pas', !rubrique.includes('SAISON PASSÉE'))
verifier(
  'sans rappel coché, pas de rubrique du tout',
  construireNewsletter({...donnees, rendezVous: []}, {projectId: 'test', dataset: 'production'}).includes('>RENDEZ-VOUS<'),
  false,
)

/* La vraie requête du Studio, exécutée par le moteur de Sanity. */
const DATASET = [
  {_type: 'evenement', _id: 'impro', title: "Match d'impro", rappelNewsletter: true, dateDebut: '2026-09-01', dateFin: '2027-06-30',
    excerpt: 'Deux équipes.', rendezVous: [{_key: 'a', date: '2026-11-06', heure: '20:00', salle: 'Hall-Bar'}]},
  {_type: 'evenement', _id: 'pas-coche', title: 'Brunch', dateDebut: '2026-09-01', excerpt: 'Brunch.'},
  {_type: 'evenement', _id: 'fini', title: 'Ancien', rappelNewsletter: true, dateDebut: '2026-01-01', dateFin: '2026-06-30', excerpt: 'Fini.'},
  {_type: 'evenement', _id: 'plus-tard', title: 'Plus tard', rappelNewsletter: true, dateDebut: '2027-01-01', excerpt: 'Pas encore.'},
  {_type: 'film', _id: 'nuit', title: 'La Nuit', status: 'a-laffiche', presence: 'la réalisatrice', presenceDate: '2026-11-06'},
  {_type: 'screening', _id: 's1', film: {_ref: 'nuit'}, date: '2026-11-06', time: '20:00', room: 'Salle 1', status: 'disponible',
    evenementDuFilm: 'avant-premiere', versionNote: 'Suivie d’une rencontre'},
]
const clientGroq = {fetch: (requete, params) => groq(requete, DATASET, params)}
const chargees = await chargerNewsletter(clientGroq, DEBUT)
verifier('la requête du Studio ne garde que l’événement coché et en cours', chargees.rendezVous.map((e) => e._id), ['impro'])
verifier('avec ses dates', chargees.rendezVous[0].rendezVous, [{date: '2026-11-06', heure: '20:00', salle: 'Hall-Bar'}])
verifier(
  'et la séance spéciale arrive avec sa mention, depuis Sanity',
  chargees.programme.filter((s) => s.filmId).map((s) => s.particularite),
  ['Avant-première · En présence de la réalisatrice · Suivie d’une rencontre'],
)

/* ------------------------------------------------------------------
   4. Sur le site : la même règle, et la case du jour mise en avant
   ------------------------------------------------------------------ */
console.log('\nSur le site, la séance spéciale dans la case de son jour')

const fenetreRendu = {console, addEventListener: () => {}, document: {body: {dataset: {root: '/'}}}}
fenetreRendu.window = fenetreRendu
vm.createContext(fenetreRendu)
vm.runInContext(readFileSync(new URL('../assets/js/render.js', import.meta.url), 'utf8'), fenetreRendu)
const R = fenetreRendu.ZinemaRender
const CAS = [
  [{date: '2026-11-06', evenementDuFilm: 'avant-premiere', versionNote: 'Suivie d’une rencontre'}, invite],
  [{date: '2026-11-07'}, invite],
  [{date: '2026-11-07'}, {presence: "l'équipe du film"}],
  [{date: '2026-11-06', evenementDuFilm: 'premiere', versionNote: 'Première'}, {}],
]
verifier(
  'le site et le Studio disent la même mention, cas par cas',
  CAS.map(([seance, f]) => [...R.particularitesDeLaSeance(seance, f)]),
  CAS.map(([seance, f]) => particulariteDeLaSeance({date: seance.date, projection: seance.evenementDuFilm, mention: seance.versionNote}, f)),
)
const filmJs = readFileSync(new URL('../assets/js/film.js', import.meta.url), 'utf8')
const cssFilm = readFileSync(new URL('../assets/css/film-mondrian.css', import.meta.url), 'utf8')
verifier('la fiche du film pose un bandeau dans la case du jour', filmJs.includes('m-seances__bloc--special') && /\.m-seances__special \{[^}]*background: var\(--ink\);/.test(cssFilm))
const agendaJs = readFileSync(new URL('../assets/js/agenda.js', import.meta.url), 'utf8')
verifier('l’agenda aussi', agendaJs.includes('m-seance__special'))
const dataSite = readFileSync(new URL('../assets/js/data.js', import.meta.url), 'utf8')
verifier('le site lit la marque de la séance et l’invité du film', /CHAMPS_SEANCE =[\s\S]*evenementDuFilm[\s\S]*presence,presenceDate/.test(dataSite))

console.log(`\n${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
