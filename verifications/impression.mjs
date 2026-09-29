/* ============================================================
   La feuille A4 du programme, vérifiée.

   Le cinéma clique « Imprimer » et affiche la feuille au mur : personne
   ne mesure les lignes avant. On vérifie donc ici que la feuille tient
   TOUJOURS sur une page, d'une semaine creuse à une semaine chargée, et
   qu'elle dit ce qu'elle doit dire.

   Le vrai code du Studio (impression/feuille.ts) est compilé par
   esbuild, puis exécuté : ce n'est pas une seconde version, c'est le même.

   Pour lancer :  npm test
   ============================================================ */
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

const {construireFeuille, tientSurUnePage, titreDeLaFeuille} = await chargerModule(
  '../sanity/plugins/planification/impression/feuille.ts',
)
const {mesuresDeLaFeuille, LIGNE_MIN} = await chargerModule(
  '../sanity/plugins/planification/impression/mesures.ts',
)

let echecs = 0
let reussites = 0

function verifier(intitule, condition, detail = '') {
  if (condition) {
    reussites += 1
    return
  }
  echecs += 1
  console.error(`✗ ${intitule}${detail ? `\n    ${detail}` : ''}`)
}

const DEBUT = '2026-09-30'
const FIN = '2026-10-06'
const JOURS = ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']

/** Une semaine ordinaire : quatre séances par jour, le dimanche à 17 h et 19 h. */
function semaine(seancesParJour) {
  return JOURS.flatMap((date) => {
    const dimanche = date === '2026-10-04'
    const heures = dimanche ? ['17:00', '17:00', '19:00', '19:00'] : ['19:00', '19:00', '21:00', '21:15']
    return Array.from({length: seancesParJour}, (_, i) => ({
      date,
      heure: heures[i % 4],
      salle: i % 2 === 0 ? 'Salle 1' : 'Hall-Bar',
      statut: 'disponible',
      filmId: `film-${i}`,
      titre: `Film numéro ${i}`,
      slug: null,
    }))
  })
}

console.log('\nLa feuille A4 du programme')

/* ---- Une seule page, quoi qu'il arrive ---- */
for (const parJour of [1, 2, 4, 5, 6, 7]) {
  const programme = semaine(parJour)
  const lignes = programme.length + JOURS.length
  const mesures = mesuresDeLaFeuille(lignes)
  verifier(
    `${programme.length} séances tiennent sur une page`,
    tientSurUnePage(programme) && mesures.hauteurTotale <= mesures.place,
    JSON.stringify(mesures),
  )
  verifier(
    `${programme.length} séances restent lisibles (lignes d'au moins ${LIGNE_MIN} mm)`,
    mesures.hauteurLigne >= LIGNE_MIN && mesures.tailleTexte >= 2,
    JSON.stringify(mesures),
  )
}
verifier(
  'Une semaine creuse ne gonfle pas démesurément',
  mesuresDeLaFeuille(8).hauteurLigne <= 9 && mesuresDeLaFeuille(8).tailleTexte <= 3.6,
)
verifier(
  'Une semaine impossible à loger sur une page est signalée',
  !tientSurUnePage(semaine(12)),
)

/* ---- Ce que la feuille dit ---- */
const html = construireFeuille(
  {debutSemaine: DEBUT, finSemaine: FIN, programme: semaine(4)},
  'https://studio.exemple/logo.png',
)
verifier(
  'Le titre annonce la semaine et son numéro',
  titreDeLaFeuille(DEBUT, FIN) === 'Programme du mercredi 30 septembre au mardi 6 octobre 2026 (40)',
  titreDeLaFeuille(DEBUT, FIN),
)
verifier('Le logo est en tête', /<img class="logo" src="https:\/\/studio\.exemple\/logo\.png"/.test(html))
verifier('Le format de page est A4', html.includes('size: A4 portrait'))
verifier(
  'Les salles sont en gras et en majuscules',
  /td\.salle \{[^}]*font-weight: bold;[^}]*text-transform: uppercase;/.test(html),
)
verifier('Les titres sont en majuscules', /td\.titre \{ text-transform: uppercase; \}/.test(html))
verifier('Chaque jour a son bandeau', (html.match(/<tr class="jour">/g) ?? []).length === 7)
verifier('Le dimanche est bien annoncé', html.includes('dimanche 4 octobre'))
verifier('Les 28 séances y sont', (html.match(/<tr class="seance">/g) ?? []).length === 28)
verifier('Les couleurs sortent à l’impression', html.includes('print-color-adjust: exact'))

const piege = construireFeuille(
  {
    debutSemaine: DEBUT,
    finSemaine: FIN,
    programme: [
      {date: DEBUT, heure: '19:00', salle: 'Salle 1', statut: 'complet', filmId: 'x', titre: '<script>Tom & Jerry</script>', slug: null},
    ],
  },
  'logo.png',
)
verifier('Un titre venu de Sanity est échappé', piege.includes('&lt;script&gt;Tom &amp; Jerry&lt;/script&gt;') && !piege.includes('<script>'))
verifier('Une séance complète le dit', piege.includes('· Complet'))

const vide = construireFeuille({debutSemaine: DEBUT, finSemaine: FIN, programme: []}, 'logo.png')
verifier('Une semaine sans séance le dit', vide.includes('Aucune séance cette semaine.'))

console.log(
  `\n${reussites} vérification${reussites > 1 ? 's' : ''} passée${reussites > 1 ? 's' : ''}` +
    (echecs ? `, ${echecs} en échec.\n` : '.\n'),
)

if (echecs > 0) {
  console.error("La feuille à imprimer ne dit plus ce qu'elle devrait.\n")
  process.exit(1)
}
