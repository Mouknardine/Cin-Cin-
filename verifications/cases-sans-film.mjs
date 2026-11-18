/* ============================================================
   Les cases sans film, vérifiées.

   Demande du cinéma (18 novembre 2026) : dans la grille de la
   Planification, pouvoir poser « Projection privée » ou « Vacances »
   à la place d'un film, et que l'agenda du site le montre.

   On vérifie ici, sur le vrai code du Studio et du site :
     1. le Studio et le site s'accordent sur ce qui ferme la journée ;
     2. aucun assistant ne pose de film sur une case sans film ;
     3. la grille met chaque case sans film à sa place ;
     4. l'agenda annonce les jours sans film, et ne les rend pas
        cliquables ;
     5. le menu de la case ne montre chaque film qu'une fois, même
        quand sa fiche a un brouillon en cours.

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

const DOSSIER = '../sanity/plugins/planification/utils/'
const {GENRES_SANS_FILM} = await chargerModule('../sanity/casesSansFilm.ts')
const {caseQuiBloque, creneauBloque, verifierAvantCreation} = await chargerModule(`${DOSSIER}cases-sans-film.ts`)
const {composerLaSemaine, creneauxLibres} = await chargerModule(`${DOSSIER}generation-semaine.ts`)
const {CRENEAUX_PAR_SEMAINE} = await chargerModule(`${DOSSIER}creneaux-standards.ts`)
const {clefDeCase, rangerLaJournee} = await chargerModule(`${DOSSIER}rangement-du-jour.ts`)

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

/* Le site, chargé tel quel comme dans le navigateur. */
function chargerLeSite(fichiers, fenetre) {
  fenetre.window = fenetre
  vm.createContext(fenetre)
  for (const fichier of fichiers) {
    vm.runInContext(readFileSync(new URL(`../assets/js/${fichier}`, import.meta.url), 'utf8'), fenetre)
  }
  return fenetre
}

const echapper = (texte) =>
  String(texte).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c])
/* L'ordre du programme du site : la date, puis l'heure, puis la salle (assez pour ces cas). */
const RANG = ['Salle 1', 'Salle 2', 'Hall-Bar']
const trier = (liste) =>
  liste.slice().sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || RANG.indexOf(a.room) - RANG.indexOf(b.room))

/* La semaine du mercredi 25 novembre au mardi 1er décembre 2026. */
const MERCREDI = '2026-11-25'
const VACANCES = {_id: 'v', date: '2026-11-27', heure: '19:00', salle: 'Salle 1', libelle: 'Vacances'}
const PRIVEE = {_id: 'p', date: '2026-11-26', heure: '19:00', salle: 'Salle 2', libelle: 'Projection privée'}
const CASES = [VACANCES, PRIVEE]

const candidate = (date, heure, salle, duree = 100) => ({filmId: 'film-1', titre: 'Film 1', duree, date, heure, salle})

console.log('\n1. Le Studio et le site disent la même chose')
{
  const site = chargerLeSite(['agenda-jours.js'], {})
  verifier(
    'les genres qui ferment la journée sont les mêmes des deux côtés',
    [...site.ZinemaAgendaJours.TOUT_LE_JOUR].sort(),
    GENRES_SANS_FILM.filter((genre) => genre.toutLeJour).map((genre) => genre.libelle).sort(),
  )
  verifier('« Projection privée » et « Vacances » sont proposés', GENRES_SANS_FILM.map((genre) => genre.libelle), ['Projection privée', 'Vacances'])
}

console.log('\n2. Aucun film sur une case sans film')
verifier('« Vacances » bloque la Salle 2 à 21 h le même jour', creneauBloque({date: '2026-11-27', salle: 'Salle 2', vague: 1}, CASES))
verifier('« Vacances » ne bloque pas le lendemain', creneauBloque({date: '2026-11-28', salle: 'Salle 1', vague: 0}, CASES), false)
verifier('« Projection privée » bloque sa case', creneauBloque({date: '2026-11-26', salle: 'Salle 2', vague: 0}, CASES))
verifier('« Projection privée » laisse l’autre salle libre', creneauBloque({date: '2026-11-26', salle: 'Salle 1', vague: 0}, CASES), false)
verifier('« Projection privée » laisse la séance de 21 h libre', creneauBloque({date: '2026-11-26', salle: 'Salle 2', vague: 1}, CASES), false)
verifier('un jour de vacances bloque même le Hall-Bar', caseQuiBloque({date: '2026-11-27', heure: '15:00', salle: 'Hall-Bar', duree: 60}, CASES)?._id, 'v')
verifier('un film de 18 h qui déborde sur la projection privée est bloqué', caseQuiBloque({date: '2026-11-26', heure: '18:00', salle: 'Salle 2', duree: 90}, CASES)?._id, 'p')

{
  const {aCreer, conflits} = verifierAvantCreation(
    [
      candidate('2026-11-27', '21:00', 'Salle 2'),
      candidate('2026-11-26', '19:00', 'Salle 2'),
      candidate('2026-11-26', '21:00', 'Salle 2'),
      candidate('2026-11-26', '19:00', 'Salle 1'),
    ],
    [],
    CASES,
  )
  verifier('seules les deux séances hors des cases sans film sont créées', aCreer.map((c) => `${c.date} ${c.heure} ${c.salle}`), [
    '2026-11-26 21:00 Salle 2',
    '2026-11-26 19:00 Salle 1',
  ])
  verifier('le bilan dit pourquoi les autres sont écartées', [
    conflits[0]?.endsWith('— jour de « Vacances »'),
    conflits[1]?.endsWith('— chevauche « Projection privée » (19:00)'),
  ], [true, true])
}

verifier(
  'Remplir au hasard : la semaine perd les 4 cases du jour de vacances et la case privée',
  creneauxLibres(MERCREDI, [], CASES).length,
  CRENEAUX_PAR_SEMAINE - 5,
)
{
  const films = [1, 2, 3, 4].map((n) => ({_id: `film-${n}`, titre: `Film ${n}`, duree: 95, statut: 'a-laffiche'}))
  const semaine = composerLaSemaine({debutSemaine: MERCREDI, films, seancesExistantes: [], casesSansFilm: CASES})
  verifier('Remplir au hasard ne pose rien sur une case sans film', semaine.filter((c) => caseQuiBloque(c, CASES)).length, 0)
  verifier('… et remplit tout le reste', semaine.length, CRENEAUX_PAR_SEMAINE - 5)
}

console.log('\n3. La grille')
{
  const seance = {_id: 's', date: '2026-11-26', heure: '19:00', salle: 'Salle 1', filmId: 'f', filmTitre: 'F', filmDuree: 90}
  const doublon = {...PRIVEE, _id: 'p2', salle: 'Salle 1'}
  const auBar = {...PRIVEE, _id: 'p3', salle: 'Hall-Bar'}
  const jour = rangerLaJournee([seance], [PRIVEE, doublon, auBar])
  verifier('la projection privée prend sa case', jour.casesSansFilm.get(clefDeCase('Salle 2', 0))?._id, 'p')
  verifier('une case déjà prise par une séance la garde', jour.seances.get(clefDeCase('Salle 1', 0))?._id, 's')
  verifier('ce qui ne trouve pas de case reste visible sous la journée', jour.casesHorsGrille.map((c) => c._id), ['p2', 'p3'])
}

console.log('\n4. L’agenda du site')
{
  const fenetre = chargerLeSite(['agenda-jours.js', 'agenda-rangees.js'], {
    document: {body: {dataset: {root: '../'}}},
    ZinemaRender: {escapeHtml: echapper, particularitesDeLaSeance: () => []},
    ZinemaCouleurs: {suivante: () => 'bleu'},
  })
  const seances = [
    {date: '2026-11-26', time: '19:00', room: 'Salle 1', status: 'disponible', film: {slug: 'dentro', title: 'Dentro'}},
    {date: '2026-11-26', time: '21:00', room: 'Salle 1', status: 'disponible', film: {slug: 'dentro', title: 'Dentro'}},
  ]
  const cases = [
    {date: '2026-11-27', time: '19:00', room: 'Salle 1', libelle: 'Vacances'},
    {date: '2026-11-27', time: '21:00', room: 'Salle 2', libelle: 'Vacances'},
    {date: '2026-11-26', time: '19:00', room: 'Salle 2', libelle: 'Projection privée'},
    {date: '2026-11-28', time: '19:00', room: 'Salle 1', libelle: '<b>Fête</b>'},
    {date: '2026-11-29', time: '19:00', room: 'Salle 1'},
  ]
  const jours = fenetre.ZinemaAgendaJours.composerLesJours(seances, cases, trier)
  verifier('un jour sans séance mais marqué apparaît', jours.map((j) => j.date), ['2026-11-26', '2026-11-27', '2026-11-28'])
  verifier('« Vacances » est annoncé une seule fois, sans heure', jours[1].journee, ['Vacances'])
  verifier('la projection privée se range entre les séances, à son heure', jours[0].screenings.map((s) => s.sansFilm ? `${s.time} privée ${s.room}` : `${s.time} ${s.room}`), [
    '19:00 Salle 1',
    '19:00 privée Salle 2',
    '21:00 Salle 1',
  ])
  verifier('rien ne casse sans aucune case sans film', fenetre.ZinemaAgendaJours.composerLesJours(seances, null, trier).length, 1)

  const html = jours.map((jour) => fenetre.ZinemaAgendaRangees.duJour(jour))
  verifier('les séances restent des liens vers leur film', (html[0].match(/<a class="m-seance"/g) ?? []).length, 2)
  verifier('une case sans film ne mène nulle part', [html[1].includes('<a '), html[1].includes('m-seance--sans-film')], [false, true])
  verifier('la projection privée garde son heure et sa salle', /m-seance--sans-film">[^]*19:00[^]*Projection privée[^]*Salle 2/.test(html[0]))
  verifier('« Vacances » n’a ni heure ni salle', [html[1].includes('m-seance__heure'), html[1].includes('Salle')], [false, false])
  verifier('le libellé est échappé', html[2].includes('&lt;b&gt;Fête&lt;/b&gt;') && !html[2].includes('<b>'))

  const page = readFileSync(new URL('../agenda/index.html', import.meta.url), 'utf8')
  const ordre = ['data.js', 'render.js', 'agenda-jours.js', 'agenda-rangees.js', 'agenda.js'].map((f) => page.indexOf(`/assets/js/${f}"`))
  verifier('la page Agenda charge ses scripts dans le bon ordre', ordre.every((position, i) => position > 0 && (i === 0 || position > ordre[i - 1])))
  const data = readFileSync(new URL('../assets/js/data.js', import.meta.url), 'utf8')
  verifier('le site ne lit que les cases sans film publiées et à venir', /_type == "sansFilm" && date >= \$today/.test(data) && data.includes('perspective=published'))
}

console.log('\n5. Le menu de la case : chaque film une seule fois')
{
  const {filmsSansDoublon} = await chargerModule(`${DOSSIER}mutations.ts`)
  const film = (_id) => ({_id, titre: 'MR. NOBODY AGAINST PUTIN', duree: 90, statut: 'a-laffiche'})
  verifier(
    'un film publié et son brouillon ne font qu’une ligne, celle du film publié',
    filmsSansDoublon([film('nobody'), film('drafts.nobody'), film('drafts.jamais-publie')]).map((f) => f._id),
    ['nobody', 'drafts.jamais-publie'],
  )
}

console.log(`\n${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
