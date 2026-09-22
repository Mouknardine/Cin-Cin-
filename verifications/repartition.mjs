/* ============================================================
   Le tirage au sort d'une semaine, vérifié.

   « Remplir la semaine au hasard » et « rebattre les cartes » font
   gagner une heure au cinéma — à condition que la grille produite
   soit utilisable. Personne ne va recompter à la main vingt-huit
   séances avant de publier : c'est ici que ça se vérifie.

   Quatre promesses sont tenues sous surveillance :

     1. chaque film obtient à peu près le même nombre de séances,
        en tenant compte de ce qu'il a déjà à l'affiche ;
     2. un film ne passe JAMAIS deux fois dans la même vague
        (même jour, même heure, les deux salles) ;
     3. ce qui est déjà programmé n'est ni déplacé ni recouvert ;
     4. un film reste dans SA salle, et en change d'un seul geste
        quand on le demande.

   Le tirage est aléatoire : chaque cas est donc rejoué deux cents
   fois, avec un hasard reproductible, pour qu'un échec rare ne passe
   pas entre les mailles.

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

const {affecterFilms, repartirEquitablement} = await chargerModule(
  '../sanity/plugins/planification/utils/repartition.ts',
)
const {composerLaSemaine, creneauxLibres} = await chargerModule(
  '../sanity/plugins/planification/utils/generation-semaine.ts',
)
const {CRENEAUX_PAR_SEMAINE, vagueDeLaSeance} = await chargerModule(
  '../sanity/plugins/planification/utils/creneaux-standards.ts',
)
const {heureDeDepart, recalagesNecessaires} = await chargerModule(
  '../sanity/plugins/planification/utils/enchainement.ts',
)
const {intervallesSeChevauchent} = await chargerModule(
  '../sanity/plugins/planification/utils/conflits.ts',
)
const {deplacementsPourChangerDeSalle} = await chargerModule(
  '../sanity/plugins/planification/utils/changement-de-salle.ts',
)
const {attribuerLesSalles, autreSalle} = await chargerModule(
  '../sanity/plugins/planification/utils/salles-attitrees.ts',
)

/* ------------------------------------------------------------------
   Un hasard reproductible : même graine, même semaine. Sans lui, un
   échec d'une fois sur mille serait impossible à rejouer.
   ------------------------------------------------------------------ */
function hasard(graine) {
  let etat = graine >>> 0
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MERCREDI = '2026-10-07'
const TIRAGES = 200

/* Des durées volontairement variées, dont deux films de plus de deux
   heures : ce sont eux qui repoussent la séance de 21 h. */
const DUREES = [96, 112, 140, 105, 163, 88, 122, 150, 99, 131, 118, 145]

function film(numero) {
  return {
    _id: `film-${numero}`,
    titre: `Film ${numero}`,
    duree: DUREES[(numero - 1) % DUREES.length],
    statut: 'a-laffiche',
  }
}

function dureeDe(filmId) {
  return film(Number(filmId.replace('film-', ''))).duree
}

/** Deux séances se chevauchent-elles quelque part dans une salle ? */
function chevauchementDansUneSalle(seances) {
  for (let i = 0; i < seances.length; i += 1) {
    for (let j = i + 1; j < seances.length; j += 1) {
      const a = seances[i]
      const b = seances[j]
      if (a.date !== b.date || a.salle !== b.salle) continue
      if (intervallesSeChevauchent(a.heure, a.duree, b.heure, b.duree)) {
        return `${a.date} ${a.salle} : ${a.heure} (${a.duree} min) et ${b.heure}`
      }
    }
  }
  return null
}

function compter(seances, clef) {
  const comptes = new Map()
  for (const seance of seances) {
    const valeur = clef(seance)
    comptes.set(valeur, (comptes.get(valeur) ?? 0) + 1)
  }
  return comptes
}

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

/* ------------------------------------------------------------------
   0. L'enchaînement des soirées, à la minute près.

   La séance de 21 h n'est pas une séance « à 21:00 » : c'est la
   seconde séance de la soirée. Elle part à 21 h si la salle est
   libre, et au quart d'heure qui suit la fin du film de 19 h s'il
   déborde. C'est la règle la plus facile à casser sans s'en
   apercevoir — d'où ces cas, écrits noir sur blanc.
   ------------------------------------------------------------------ */
function de19h(dureeMin) {
  return {heure: '19:00', filmDuree: dureeMin}
}

verifier('La première séance part toujours à 19 h', heureDeDepart(0, null) === '19:00')
verifier('Salle libre, la seconde part à 21 h', heureDeDepart(1, null) === '21:00')
verifier(
  'Un film court ne décale rien : 1 h 30 finit à 20:30',
  heureDeDepart(1, de19h(90)) === '21:00',
)
verifier(
  'Un film de 2 h pile libère la salle à 21:00, et la suite part à 21:00',
  heureDeDepart(1, de19h(120)) === '21:00',
)
verifier(
  'Un film de 2 h 20 repousse la séance suivante au quart d’heure suivant : 21:30',
  heureDeDepart(1, de19h(140)) === '21:30',
  heureDeDepart(1, de19h(140)),
)
verifier(
  'Un film de 2 h 43 repousse la séance suivante à 21:45',
  heureDeDepart(1, de19h(163)) === '21:45',
  heureDeDepart(1, de19h(163)),
)
verifier(
  'Un film qui finit pile sur un quart d’heure laisse partir la suite à cette minute : 21:15',
  heureDeDepart(1, de19h(135)) === '21:15',
  heureDeDepart(1, de19h(135)),
)
verifier(
  'Une minute de trop suffit à passer au quart d’heure suivant : 21:01 donne 21:15',
  heureDeDepart(1, de19h(121)) === '21:15',
  heureDeDepart(1, de19h(121)),
)
verifier(
  'Sans durée connue, on compte 2 h et rien ne bouge',
  heureDeDepart(1, de19h(null)) === '21:00',
)
verifier(
  'Une séance de 19:30 décale aussi : 2 h depuis 19:30 finit à 21:30',
  heureDeDepart(1, {heure: '19:30', filmDuree: 120}) === '21:30',
  heureDeDepart(1, {heure: '19:30', filmDuree: 120}),
)

verifier('19:00 appartient à la vague de 19 h', vagueDeLaSeance(posee('x', '19:00', 'Salle 1', 1)) === 0)
verifier('21:00 appartient à la vague de 21 h', vagueDeLaSeance(posee('x', '21:00', 'Salle 1', 1)) === 1)
verifier(
  'Une séance décalée à 21:20 reste la séance de 21 h',
  vagueDeLaSeance(posee('x', '21:20', 'Salle 2', 1)) === 1,
)
verifier(
  'Une avant-première à 18 h sort de la grille',
  vagueDeLaSeance(posee('x', '18:00', 'Salle 1', 1)) === -1,
)
verifier(
  'Le Hall-Bar sort de la grille',
  vagueDeLaSeance(posee('x', '20:00', 'Hall-Bar', 1)) === -1,
)

function seance(id, heure, salle, dureeMin, titre) {
  return {_id: id, date: MERCREDI, heure, salle, filmDuree: dureeMin, filmTitre: titre}
}

const aRecaler = recalagesNecessaires([
  seance('a', '19:00', 'Salle 1', 140, 'Le long'),
  seance('b', '21:00', 'Salle 1', 95, 'Le court'),
])
verifier(
  'Derrière un film de 2 h 20, la séance de 21 h est repoussée à 21:30',
  aRecaler.length === 1 && aRecaler[0].id === 'b' && aRecaler[0].vers === '21:30',
  JSON.stringify(aRecaler),
)

verifier(
  'Un battement volontaire n’est jamais repris : 21:30 derrière un film qui finit à 20:30',
  recalagesNecessaires([
    seance('a', '19:00', 'Salle 1', 90, 'Le court'),
    seance('b', '21:30', 'Salle 1', 95, 'Le suivant'),
  ]).length === 0,
)

verifier(
  'Une séance déjà à la bonne heure n’est pas retouchée',
  recalagesNecessaires([
    seance('a', '19:00', 'Salle 1', 140, 'Le long'),
    seance('b', '21:30', 'Salle 1', 95, 'Le suivant'),
  ]).length === 0,
)

verifier(
  'Deux salles différentes ne se gênent pas',
  recalagesNecessaires([
    seance('a', '19:00', 'Salle 1', 163, 'Le très long'),
    seance('b', '21:00', 'Salle 2', 95, 'L’autre salle'),
  ]).length === 0,
)

verifier(
  'Le Hall-Bar ne décale personne',
  recalagesNecessaires([
    seance('a', '19:00', 'Hall-Bar', 163, 'Un événement'),
    seance('b', '21:00', 'Hall-Bar', 95, 'Un autre'),
  ]).length === 0,
)

/* ------------------------------------------------------------------
   1. Le partage est équitable, et tient compte du déjà-programmé.
   ------------------------------------------------------------------ */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const films = [1, 2, 3, 4, 5].map((n) => film(n)._id)
  const pool = repartirEquitablement(films, CRENEAUX_PAR_SEMAINE, {}, hasard(graine))
  const comptes = films.map((id) => pool.filter((autre) => autre === id).length)
  verifier(
    'Sans historique, les films se partagent les séances à une près',
    Math.max(...comptes) - Math.min(...comptes) <= 1,
    `graine ${graine} : ${comptes.join(', ')}`,
  )
}

for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const films = ['a', 'b', 'c', 'd']
  /* « a » a déjà six séances d'avance : à la fin, les totaux doivent
     s'être rejoints, pas s'être creusés. */
  const deja = {a: 6, b: 0, c: 0, d: 0}
  const pool = repartirEquitablement(films, 20, deja, hasard(graine))
  const totaux = films.map((id) => deja[id] + pool.filter((autre) => autre === id).length)
  verifier(
    'Un film déjà très programmé en reçoit moins, et les totaux se rejoignent',
    Math.max(...totaux) - Math.min(...totaux) <= 1,
    `graine ${graine} : ${totaux.join(', ')}`,
  )
}

/* ------------------------------------------------------------------
   2. Une semaine tirée au sort reste lisible.
   ------------------------------------------------------------------ */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const films = [1, 2, 3, 4, 5].map(film)
  const semaine = composerLaSemaine(
    {debutSemaine: MERCREDI, films, seancesExistantes: [], dejaProgrammees: {}},
    hasard(graine),
  )

  verifier(
    'La semaine est remplie entièrement',
    semaine.length === CRENEAUX_PAR_SEMAINE,
    `graine ${graine} : ${semaine.length} séances`,
  )

  const parVague = compter(semaine, (s) => `${s.filmId}|${s.date}|${vagueDeLaSeance(s)}`)
  verifier(
    'Aucun film ne passe deux fois dans la même vague',
    [...parVague.values()].every((n) => n === 1),
    `graine ${graine}`,
  )

  const parJour = compter(semaine, (s) => `${s.filmId}|${s.date}`)
  verifier(
    'Avec assez de jours, aucun film ne passe deux fois le même jour',
    [...parJour.values()].every((n) => n === 1),
    `graine ${graine}`,
  )

  const parFilm = compter(semaine, (s) => s.filmId)
  verifier('Chaque film retenu obtient des séances', parFilm.size === films.length, `graine ${graine}`)

  const sallesParFilm = compter(semaine, (s) => `${s.filmId}|${s.salle}`)
  verifier(
    'Chaque film reste dans une seule salle toute la semaine',
    sallesParFilm.size === parFilm.size,
    `graine ${graine}`,
  )

  /* L'égalité se juge DANS une salle : cinq films sur deux salles de
     quatorze cases ne peuvent pas avoir tous le même nombre de séances
     sans changer de salle — et c'est la salle qui prime. */
  for (const salle of ['Salle 1', 'Salle 2']) {
    const comptes = [...compter(
      semaine.filter((s) => s.salle === salle),
      (s) => s.filmId,
    ).values()]
    verifier(
      'Dans une même salle, les films ont à peu près le même nombre de séances',
      comptes.length > 0 && Math.max(...comptes) - Math.min(...comptes) <= 1,
      `graine ${graine}, ${salle} : ${comptes.join(', ')}`,
    )
  }

  const cases = compter(semaine, (s) => `${s.date}|${s.salle}|${vagueDeLaSeance(s)}`)
  verifier(
    'Deux séances ne tombent jamais sur la même case',
    [...cases.values()].every((n) => n === 1),
    `graine ${graine}`,
  )

  verifier(
    'Aucune séance n’en chevauche une autre dans la même salle',
    chevauchementDansUneSalle(semaine) === null,
    `graine ${graine} : ${chevauchementDansUneSalle(semaine)}`,
  )
}

/* ------------------------------------------------------------------
   3. Ce qui est déjà là reste là.
   ------------------------------------------------------------------ */
function posee(id, heure, salle, numeroDeFilm) {
  return {
    _id: id,
    date: MERCREDI,
    heure,
    salle,
    filmId: `film-${numeroDeFilm}`,
    filmDuree: film(numeroDeFilm).duree,
    filmTitre: film(numeroDeFilm).titre,
  }
}

const dejaPosees = [
  posee('s1', '19:00', 'Salle 1', 1),
  posee('s2', '21:00', 'Salle 2', 2),
  /* Une séance particulière au Hall-Bar : elle n'occupe aucune case
     ordinaire et ne doit donc en libérer ni en bloquer aucune. */
  posee('s3', '20:00', 'Hall-Bar', 3),
]

verifier(
  'Les séances déjà posées retirent leurs cases, et elles seules',
  creneauxLibres(MERCREDI, dejaPosees).length === CRENEAUX_PAR_SEMAINE - 2,
  `${creneauxLibres(MERCREDI, dejaPosees).length} cases libres`,
)

for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const semaine = composerLaSemaine(
    {
      debutSemaine: MERCREDI,
      films: [1, 2, 3, 4, 5].map(film),
      seancesExistantes: dejaPosees,
      dejaProgrammees: {},
    },
    hasard(graine),
  )
  const recouvre = semaine.some((s) =>
    dejaPosees.some(
      (deja) =>
        deja.date === s.date &&
        deja.salle === s.salle &&
        vagueDeLaSeance(deja) === vagueDeLaSeance(s),
    ),
  )
  verifier('Aucune case déjà occupée n’est reprise', !recouvre, `graine ${graine}`)

  verifier(
    'Les nouvelles séances n’empiètent pas sur celles déjà en salle',
    chevauchementDansUneSalle([
      ...semaine,
      ...dejaPosees.map((deja) => ({...deja, duree: deja.filmDuree})),
    ]) === null,
    `graine ${graine}`,
  )

  const memeVagueQueLexistant = semaine.some((s) =>
    dejaPosees.some(
      (deja) =>
        deja.filmId === s.filmId &&
        deja.date === s.date &&
        vagueDeLaSeance(deja) === vagueDeLaSeance(s),
    ),
  )
  verifier(
    'Un film déjà à l’affiche à cette heure-là n’est pas remis dans la même vague',
    !memeVagueQueLexistant,
    `graine ${graine}`,
  )
}

/* ------------------------------------------------------------------
   4. Rebattre les cartes ne change ni le nombre de séances ni les films.
   ------------------------------------------------------------------ */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const creneaux = [
    {date: MERCREDI, salle: 'Salle 1', vague: 0},
    {date: MERCREDI, salle: 'Salle 1', vague: 1},
    {date: '2026-10-08', salle: 'Salle 2', vague: 0},
    {date: '2026-10-08', salle: 'Salle 2', vague: 1},
  ]
  const pool = ['film-1', 'film-1', 'film-2', 'film-3']
  const melangee = affecterFilms(creneaux, pool, {alea: hasard(graine)})
  verifier(
    'Le rebattage garde exactement les mêmes films, en même nombre',
    melangee.length === pool.length &&
      JSON.stringify(melangee.map((a) => a.filmId).sort()) === JSON.stringify([...pool].sort()),
    `graine ${graine}`,
  )
}

/* ------------------------------------------------------------------
   5. Trop peu de films : la grille reste correcte là où elle le peut.

   Avec trois films pour quatre séances par jour, un film DOIT revenir
   deux fois dans la journée — c'est arithmétique. Ce qui ne doit
   jamais arriver, en revanche, c'est qu'il passe dans les deux salles
   au même moment : le public n'aurait pas le choix.
   ------------------------------------------------------------------ */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const semaine = composerLaSemaine(
    {debutSemaine: MERCREDI, films: [1, 2, 3].map(film), seancesExistantes: []},
    hasard(graine),
  )
  const parVague = compter(semaine, (s) => `${s.filmId}|${s.date}|${vagueDeLaSeance(s)}`)
  verifier(
    'Même à court de films, aucun doublon dans la même vague',
    semaine.length === CRENEAUX_PAR_SEMAINE && [...parVague.values()].every((n) => n === 1),
    `graine ${graine}`,
  )
}

/* ------------------------------------------------------------------
   6. Beaucoup de films : tout le monde passe.
   ------------------------------------------------------------------ */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const films = Array.from({length: 12}, (_, n) => film(n + 1))
  const semaine = composerLaSemaine(
    {debutSemaine: MERCREDI, films, seancesExistantes: []},
    hasard(graine),
  )
  const parFilm = compter(semaine, (s) => s.filmId)
  const comptes = [...parFilm.values()]
  verifier(
    'Avec douze films, six par salle, chacun obtient deux ou trois séances',
    parFilm.size === films.length && Math.max(...comptes) - Math.min(...comptes) <= 1,
    `graine ${graine} : ${comptes.join(', ')}`,
  )
}

/* ------------------------------------------------------------------
   7. Les cas limites ne font rien exploser.
   ------------------------------------------------------------------ */
verifier(
  'Sans film sélectionné, aucune séance n’est proposée',
  composerLaSemaine({debutSemaine: MERCREDI, films: [], seancesExistantes: []}).length === 0,
)

verifier(
  'Un seul film remplit sa salle, et ne déborde pas dans l’autre',
  composerLaSemaine({debutSemaine: MERCREDI, films: [film(1)], seancesExistantes: []}).length ===
    CRENEAUX_PAR_SEMAINE / 2,
)

/* ------------------------------------------------------------------
   8. Un film reste dans SA salle.

   C'est la demande du cinéma : le tirage choisit le jour et le moment
   de la soirée, jamais la salle. La salle d'un film vient de ce qu'il
   joue déjà cette semaine, sinon de la semaine d'avant ; un nouveau
   venu va dans la salle qui a le moins de films.
   ------------------------------------------------------------------ */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const semaine = composerLaSemaine(
    {
      debutSemaine: MERCREDI,
      films: [1, 2, 3, 4].map(film),
      /* Le film 2 joue déjà mercredi en Salle 2. */
      seancesExistantes: [posee('d1', '21:00', 'Salle 2', 2)],
      /* Le film 1 jouait en Salle 1 la semaine d'avant, le film 3 en Salle 2. */
      semainePrecedente: [
        {filmId: 'film-1', salle: 'Salle 1'},
        {filmId: 'film-1', salle: 'Salle 1'},
        {filmId: 'film-3', salle: 'Salle 2'},
      ],
    },
    hasard(graine),
  )
  const sallesDe = (filmId) => new Set(semaine.filter((s) => s.filmId === filmId).map((s) => s.salle))
  verifier(
    'Un film qui joue déjà en Salle 2 cette semaine y reste',
    [...sallesDe('film-2')].every((salle) => salle === 'Salle 2'),
    `graine ${graine} : ${[...sallesDe('film-2')].join(', ')}`,
  )
  verifier(
    'Un film qui jouait en Salle 1 la semaine d’avant y reste',
    [...sallesDe('film-1')].every((salle) => salle === 'Salle 1'),
    `graine ${graine}`,
  )
  verifier(
    'Un film qui jouait en Salle 2 la semaine d’avant y reste',
    [...sallesDe('film-3')].every((salle) => salle === 'Salle 2'),
    `graine ${graine}`,
  )
  verifier(
    'Le nouveau venu va dans la salle qui a le moins de films',
    [...sallesDe('film-4')].every((salle) => salle === 'Salle 1'),
    `graine ${graine} : ${[...sallesDe('film-4')].join(', ')}`,
  )
}

for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const salles = attribuerLesSalles(['a', 'b', 'c', 'd'], {semaine: [], semainePrecedente: []}, hasard(graine))
  const enSalle1 = [...salles.values()].filter((salle) => salle === 'Salle 1').length
  verifier('Quatre nouveaux films se partagent les salles deux à deux', enSalle1 === 2, `graine ${graine}`)
}

for (let graine = 1; graine <= TIRAGES; graine += 1) {
  /* Trois films tous installés en Salle 1 : la Salle 2 resterait vide
     toute la semaine. L'un d'eux déménage — pas celui qui joue déjà. */
  const salles = attribuerLesSalles(
    ['a', 'b', 'c'],
    {
      semaine: [{filmId: 'a', salle: 'Salle 1'}],
      semainePrecedente: [
        {filmId: 'b', salle: 'Salle 1'},
        {filmId: 'c', salle: 'Salle 1'},
      ],
    },
    hasard(graine),
  )
  verifier(
    'Aucune salle ne reste sans film quand l’autre en a plusieurs',
    [...salles.values()].includes('Salle 2') && salles.get('a') === 'Salle 1',
    `graine ${graine} : ${JSON.stringify([...salles])}`,
  )
}

/* ------------------------------------------------------------------
   9. Changer un film de salle, en un geste, pour toute la semaine.
   ------------------------------------------------------------------ */
function enSalle(id, date, heure, salle, filmId) {
  return {_id: id, date, heure, salle, filmId, filmTitre: filmId, filmDuree: 100}
}
{
  const JEUDI = '2026-10-08'
  const semaine = [
    enSalle('a1', MERCREDI, '19:00', 'Salle 1', 'A'),
    enSalle('a2', JEUDI, '21:15', 'Salle 1', 'A'),
    enSalle('b1', MERCREDI, '19:00', 'Salle 2', 'B'),
    enSalle('c1', JEUDI, '21:00', 'Salle 2', 'C'),
    enSalle('a3', MERCREDI, '17:00', 'Salle 1', 'A'),
  ]
  const deplacements = deplacementsPourChangerDeSalle(semaine, 'A', 'Salle 2')
  const vers = (id) => deplacements.find((d) => d.id === id)?.vers
  verifier(
    'Le film passe dans l’autre salle, au même jour et au même moment',
    vers('a1')?.salle === 'Salle 2' && vers('a1')?.heure === '19:00' && vers('a1')?.date === MERCREDI,
    JSON.stringify(deplacements),
  )
  verifier(
    'Le film qui occupait la place fait le chemin inverse : personne n’est recouvert',
    vers('b1')?.salle === 'Salle 1' && vers('c1')?.salle === 'Salle 1',
    JSON.stringify(deplacements),
  )
  verifier(
    'La séance de 21 h repart de 21:00 : l’outil la recale ensuite au bon quart d’heure',
    vers('a2')?.heure === '21:00' && vers('c1')?.heure === '21:00',
    JSON.stringify(deplacements),
  )
  verifier(
    'Une séance particulière (17 h) ne déménage pas',
    vers('a3') === undefined,
  )
  verifier(
    'Un film déjà dans la bonne salle ne bouge pas',
    deplacementsPourChangerDeSalle(semaine, 'B', 'Salle 2').length === 0,
  )
}

verifier('L’autre salle de la Salle 1 est la Salle 2', autreSalle('Salle 1') === 'Salle 2')
verifier('Le Hall-Bar n’a pas d’autre salle', autreSalle('Hall-Bar') === null)

console.log(`\n${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
