/* ============================================================
   La newsletter, vérifiée là où on la lit vraiment.

   Le cinéma copie la newsletter dans le Studio, la colle dans Outlook, et
   l'envoie. Entre les deux, chaque messagerie la réécrit à sa façon — et
   un défaut invisible dans l'aperçu du Studio peut arriver chez tous les
   abonnés. C'est arrivé le 5 octobre 2026 : les pastilles des séances se
   sont fondues en un seul bloc, « MER 30 19:00JEU 1 21:00… », et l'on ne
   voyait plus quelle séance on achetait.

   Ce fichier rejoue donc la newsletter, la vraie (gabarit.ts compilé), de
   trois façons, à la largeur d'un téléphone et d'un ordinateur :

     1. Telle quelle, dans Chromium — ce que montrent Apple Mail, Gmail et
        l'aperçu du Studio.
     2. Collée dans Roosterjs, l'éditeur de Microsoft qu'utilise le nouvel
        Outlook, avec ses réglages par défaut — plus stricts que ceux
        d'Outlook : ce qui passe ici passe là-bas. C'est lui qui fusionnait
        les pastilles.
     3. Privée de ce que Word ignore — display, marges, marge intérieure
        des textes en ligne — comme la dessine l'Outlook classique pour
        Windows, qui lit le HTML avec Word. Une approximation : Word
        lui-même ne tourne pas ici.

   Et dans chacune, on regarde ce que l'abonné voit : chaque séance dans sa
   propre pastille, séparée des autres et cliquable ; les étiquettes en
   capitales ; le lundi et le mardi en grisé au-dessus du programme ;
   rien qui dépasse de l'écran.

   Pour lancer :  npm run test:messageries
   (Chromium doit être installé : npx playwright install chromium)
   Pour garder les captures :  CAPTURES=dossier npm run test:messageries
   ============================================================ */
import {build} from 'esbuild'
import {mkdirSync} from 'node:fs'
import {chromium} from 'playwright'

const RACINE = new URL('..', import.meta.url).pathname
const NEWSLETTER = '../sanity/plugins/planification/newsletter/'

async function chargerModule(chemin) {
  const compile = await build({
    entryPoints: [new URL(chemin, import.meta.url).pathname],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  return import(`data:text/javascript;base64,${Buffer.from(compile.outputFiles[0].text).toString('base64')}`)
}

const {construireNewsletter} = await chargerModule(`${NEWSLETTER}gabarit.ts`)
const {programmeEntre} = await chargerModule(`${NEWSLETTER}donnees.ts`)
const {seancesAnnoncees} = await chargerModule(`${NEWSLETTER}seances.ts`)
const {etiquetteDuFilm} = await chargerModule(`${NEWSLETTER}etiquette.ts`)

/* L'éditeur du nouvel Outlook, compilé pour le navigateur. */
const editeur = await build({
  stdin: {
    contents: `
      import {Editor, paste} from 'roosterjs-content-model-core'
      import {PastePlugin} from 'roosterjs-content-model-plugins'
      window.coller = (html) => {
        const zone = document.getElementById('editeur')
        const editor = new Editor(zone, {plugins: [new PastePlugin()]})
        editor.focus()
        paste(editor, {types: ['text/html', 'text/plain'], text: '', rawHtml: html, image: null, customValues: {}})
      }`,
    resolveDir: RACINE,
    loader: 'js',
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  write: false,
  logLevel: 'silent',
})
const SCRIPT_EDITEUR = editeur.outputFiles[0].text

/* ------------------------------------------------------------------
   Une semaine complète, comme le cinéma en programme : des films de
   première, troisième et énième semaine, un film sans date de sortie,
   deux annonces, le lundi et le mardi de l'envoi, un titre très long.
   ------------------------------------------------------------------ */
const DEBUT = '2026-10-07'
const FIN = '2026-10-13'
const S = (date, heure, salle, statut = 'disponible') => ({date, heure, salle, statut})
const film = (o) => ({
  typeDeFilm: 'Fiction', genres: [], realisation: 'Une Réalisatrice', pays: 'Suisse', annee: 2026,
  duree: 90, version: 'VF', sousTitres: null, age: '12/16 ans', dateDeSortie: null,
  premiereProjection: null, statut: 'a-laffiche', bandeAnnonce: null, presse: null, afficheRef: null,
  synopsis: 'Un synopsis de quelques lignes, comme ceux du cinéma.', slug: o._id, seances: [], ...o,
})
const FILMS = [
  film({_id: 'bonheur', titre: 'Ah que le bonheur est proche !', dateDeSortie: '2026-10-07', seances: [
    S('2026-10-07', '19:00', 'Salle 1'), S('2026-10-08', '21:00', 'Salle 1'), S('2026-10-10', '17:00', 'Salle 2'),
    S('2026-10-11', '19:00', 'Salle 1'), S('2026-10-12', '21:00', 'Salle 1'), S('2026-10-13', '19:00', 'Salle 1')]}),
  film({_id: 'buser', titre: 'Barbara Buser - Pionnière du développement durable', typeDeFilm: 'Documentaire',
    premiereProjection: '2026-09-23', seances: [
      S('2026-10-05', '19:00', 'Salle 1'), S('2026-10-06', '21:00', 'Hall-Bar'), S('2026-10-07', '21:00', 'Salle 2'),
      S('2026-10-09', '19:00', 'Salle 2'), S('2026-10-11', '17:00', 'Salle 1'), S('2026-10-12', '19:00', 'Salle 2'),
      S('2026-10-13', '21:00', 'Salle 2')]}),
  film({_id: 'matins', titre: 'Les Matins merveilleux', dateDeSortie: '2026-09-16', seances: [
    S('2026-10-05', '21:00', 'Salle 2'), S('2026-10-08', '19:00', 'Salle 2'), S('2026-10-09', '21:15', 'Salle 1')]}),
  film({_id: 'argent', titre: 'Notre argent', dateDeSortie: '2026-04-15', seances: [
    S('2026-10-06', '19:00', 'Salle 2'), S('2026-10-10', '21:00', 'Salle 1', 'annule'), S('2026-10-12', '17:00', 'Salle 2')]}),
]
const A_VENIR = [
  film({_id: 'kalari', titre: 'Kalari Kid', statut: 'prochainement', dateDeSortie: '2026-10-14',
    seances: [S('2026-10-14', '19:00', 'Salle 1')]}),
  film({_id: 'laundry', titre: 'Laundry', dateDeSortie: '2026-02-11', seances: [S('2026-10-21', '19:00', 'Salle 2')]}),
]
const REGLAGES = {
  adresse: 'Rue du Maupas 4\n1004 Lausanne', telephone: '021 311 29 30', telephoneBis: '076 567 12 91',
  email: 'admin@zinema.ch', tarifPlein: 16, tarifReduit: 10, conditionsReduit: ['Membres de soutien'],
  salles: [{nom: 'Salle 1', places: 18}, {nom: 'Salle 2', places: 14}, {nom: 'Hall-Bar', places: 50}],
  iban: 'CH79 0900 0000 1725 7734 1',
}
const programme = programmeEntre(FILMS, DEBUT, FIN)
const ordre = [...new Set(programme.map((s) => s.filmId))]
const DONNEES = {
  debutSemaine: DEBUT, finSemaine: FIN, programme,
  lundiEtMardi: programmeEntre(FILMS, '2026-10-05', '2026-10-06'),
  filmsDeLaSemaine: ordre.map((id) => FILMS.find((f) => f._id === id)),
  filmsAVenir: A_VENIR, reglages: REGLAGES,
}
const HTML = construireNewsletter(DONNEES, {projectId: 'vle63mzm', dataset: 'production'})

/* Ce que l'abonné doit trouver, calculé par le code du Studio. */
const PASTILLES_ATTENDUES = DONNEES.filmsDeLaSemaine.flatMap((f) => seancesAnnoncees(f.seances, DEBUT, FIN))
const ETIQUETTES_ATTENDUES = [...DONNEES.filmsDeLaSemaine, ...A_VENIR]
  .map((f) => etiquetteDuFilm(f, DEBUT)?.texte.toLocaleUpperCase('fr-CH'))
  .filter(Boolean)

/* ------------------------------------------------------------------
   Les trois rendus.
   ------------------------------------------------------------------ */
const PAGE = (corps) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
  `<body style="margin:0;padding:0;background:#fff;">${corps}</body></html>`

/** Ce que Word ignore, retiré de la page — à appeler dans le navigateur. */
function commeWord() {
  /* mso-padding-alt est la marge intérieure que Word lit sur une case, à la
     place de padding. On la relève AVANT de toucher aux styles : le
     navigateur réécrit l'attribut style sans les propriétés qu'il ignore. */
  const msoPadding = [...document.querySelectorAll('td')].map((td) => [
    td,
    /mso-padding-alt:\s*([^;"]+)/.exec(td.getAttribute('style') ?? '')?.[1],
  ])
  const EN_LIGNE = new Set(['A', 'SPAN', 'B', 'STRONG', 'EM', 'I', 'U'])
  for (const el of document.querySelectorAll('[style]')) {
    for (const p of ['display', 'max-width', 'float', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']) {
      el.style.removeProperty(p)
    }
    if (EN_LIGNE.has(el.tagName)) {
      for (const p of ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left']) el.style.removeProperty(p)
    }
  }
  for (const [td, valeur] of msoPadding) if (valeur) td.style.padding = valeur
}

const RENDUS = [
  {nom: 'Apple Mail / navigateur', largeurs: [375, 640]},
  {nom: 'nouvel Outlook (collée dans Roosterjs)', largeurs: [375, 640], colle: true},
  {nom: 'Outlook classique (Word, approché)', largeurs: [640], word: true},
]

/* ------------------------------------------------------------------
   Ce qu'on mesure dans la page, une fois rendue.
   ------------------------------------------------------------------ */
function mesurer() {
  const texte = (el) => (el.innerText ?? '').replace(/\s+/g, ' ').trim()
  const HEURE = /\d{1,2}:\d{2}/
  const bordure = (el) => parseFloat(getComputedStyle(el).borderTopWidth) >= 2
  const tous = [...document.body.querySelectorAll('*')]
  /** La première fois que ce texte paraît, au plus près : l'élément qui le
      porte exactement, sans enfant qui le porte aussi. Sans tenir compte des
      capitales, vérifiées à part : chaque vérification ne mesure qu'une chose. */
  const pareil = (el, cherche) => texte(el).toLocaleUpperCase('fr-CH') === cherche
  const trouver = (cherche) =>
    tous.find((el) => pareil(el, cherche) && ![...el.children].some((enfant) => pareil(enfant, cherche))) ?? null
  const apres = (repere, el) => Boolean(repere.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && !repere.contains(el)

  const titreFilms = trouver('LES FILMS DE LA SEMAINE')
  const casePlus = trouver('PROCHAINEMENT')
  /* Les pastilles : les plus petites cases encadrées qui portent une heure,
     entre « Les films de la semaine » et « Prochainement ». */
  const candidates = titreFilms
    ? tous.filter((el) => apres(titreFilms, el) && (!casePlus || apres(el, casePlus)) && bordure(el) && HEURE.test(texte(el)))
    : []
  const pastilles = candidates
    .filter((el) => !candidates.some((autre) => autre !== el && el.contains(autre)))
    .map((el) => {
      const r = el.getBoundingClientRect()
      const lien = el.querySelector('a[href]') ?? el.closest('a[href]')
      return {
        texte: texte(el),
        heures: (texte(el).match(/\d{1,2}:\d{2}/g) ?? []).length,
        lien: lien?.getAttribute('href') ?? null,
        gauche: r.left, droite: r.right, haut: r.top, bas: r.bottom,
      }
    })

  const programmeDu = tous.find((el) => /^PROGRAMME DU /i.test(texte(el)) && el.children.length <= 1)
  const lundi = trouver('LUNDI 5 OCTOBRE')
  const premierGris = trouver('BARBARA BUSER - PIONNIÈRE DU DÉVELOPPEMENT DURABLE')

  return {
    texte: texte(document.body),
    pastilles,
    lundiAvantLeProgramme: Boolean(lundi && programmeDu && apres(lundi, programmeDu)),
    couleurPremiereLigneGrise: premierGris ? getComputedStyle(premierGris).color : null,
    largeurPage: document.documentElement.scrollWidth,
    /* Le bleu par défaut d'un lien, quand la messagerie n'a pas reçu sa couleur. */
    liensBleus: [...document.querySelectorAll('a[href]')]
      .filter((a) => getComputedStyle(a).color === 'rgb(0, 0, 238)')
      .map((a) => texte(a) || a.getAttribute('href')),
    liens: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  }
}

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

const CAPTURES = process.env.CAPTURES
if (CAPTURES) mkdirSync(CAPTURES, {recursive: true})

const navigateur = await chromium.launch()
try {
  console.log('\nLa newsletter, dans les messageries\n')
  let texteDeReference = null

  for (const rendu of RENDUS) {
    for (const largeur of rendu.largeurs) {
      console.log(`${rendu.nom}, ${largeur} px`)
      const page = await navigateur.newPage({viewport: {width: largeur, height: 900}})
      /* Rien ne sort : ni le logo du site, ni les affiches de Sanity. */
      await page.route('**/*', (route) => (route.request().url().startsWith('http') ? route.abort() : route.continue()))

      if (rendu.colle) {
        await page.setContent(PAGE(`<div id="editeur" contenteditable="true" style="width:${largeur}px;"></div>`))
        await page.addScriptTag({content: SCRIPT_EDITEUR})
        await page.evaluate((html) => window.coller(html), HTML)
      } else {
        await page.setContent(PAGE(HTML))
        if (rendu.word) await page.evaluate(commeWord)
      }
      const m = await page.evaluate(mesurer)
      if (CAPTURES) {
        await page.screenshot({path: `${CAPTURES}/${rendu.nom.split(' ')[0].toLowerCase()}-${rendu.word ? 'word' : rendu.colle ? 'colle' : 'brut'}-${largeur}.png`, fullPage: true})
      }
      await page.close()

      /* ---- Les pastilles : une séance chacune, séparées, cliquables ---- */
      verifier(
        `les ${PASTILLES_ATTENDUES.length} séances annoncées ont chacune leur pastille`,
        m.pastilles.length === PASTILLES_ATTENDUES.length,
        `${m.pastilles.length} pastilles : ${m.pastilles.map((p) => p.texte).join(' | ')}`,
      )
      verifier(
        'aucune pastille ne réunit deux séances',
        m.pastilles.every((p) => p.heures === 1 && /^[A-ZÉÈÛ]{3} \d{1,2} \d{2}:\d{2}$/.test(p.texte)),
        m.pastilles.filter((p) => p.heures !== 1 || !/^[A-ZÉÈÛ]{3} \d{1,2} \d{2}:\d{2}$/.test(p.texte)).map((p) => `« ${p.texte} »`).join(', '),
      )
      const chevauchements = m.pastilles.flatMap((a, i) =>
        m.pastilles.slice(i + 1).filter((b) =>
          Math.min(a.droite, b.droite) - Math.max(a.gauche, b.gauche) > 0.5 &&
          Math.min(a.bas, b.bas) - Math.max(a.haut, b.haut) > 0.5,
        ).map((b) => `${a.texte} / ${b.texte}`),
      )
      verifier('aucune pastille ne chevauche une autre', chevauchements.length === 0, chevauchements.join(', '))
      const collees = m.pastilles.slice(1).filter((p, i) => {
        const avant = m.pastilles[i]
        return Math.abs(p.haut - avant.haut) < 3 && p.gauche - avant.droite < 3
      })
      verifier(
        'deux pastilles voisines restent séparées par un espace visible',
        collees.length === 0,
        collees.map((p) => p.texte).join(', '),
      )
      verifier(
        'chaque pastille mène à la fiche de son film',
        m.pastilles.every((p) => p.lien && /^https:\/\/www\.zinema\.ch\/film\/\?s=/.test(p.lien)),
      )
      verifier(
        "aucune pastille ne dépasse de l'écran",
        m.pastilles.every((p) => p.droite <= largeur + 0.5),
      )

      /* ---- Les capitales, écrites et non seulement stylées ---- */
      const manquantes = ETIQUETTES_ATTENDUES.filter((e) => !m.texte.includes(e))
      verifier(
        `les ${ETIQUETTES_ATTENDUES.length} étiquettes sont là, en capitales`,
        manquantes.length === 0,
        `absentes : ${manquantes.join(' | ')}`,
      )
      const capitales = ['PROGRAMME DU MERCREDI 7 OCTOBRE AU MARDI 13 OCTOBRE 2026 (41)', 'LES FILMS DE LA SEMAINE',
        'PROCHAINEMENT', 'INFOS', 'ACHETER UN BILLET SUR ZINEMA.CH', 'AH QUE LE BONHEUR EST PROCHE !', 'MERCREDI 7 OCTOBRE']
      verifier(
        'les titres restent en capitales',
        capitales.every((t) => m.texte.includes(t)),
        capitales.filter((t) => !m.texte.includes(t)).join(' | '),
      )

      /* ---- Le lundi et le mardi de l'envoi ---- */
      verifier("le lundi de l'envoi passe au-dessus du programme de la semaine", m.lundiAvantLeProgramme)
      verifier(
        'ses séances sont en grisé',
        m.couleurPremiereLigneGrise === 'rgb(128, 125, 118)',
        String(m.couleurPremiereLigneGrise),
      )

      /* ---- Le reste ---- */
      if (!rendu.word) {
        verifier("rien ne dépasse de l'écran", m.largeurPage <= largeur + 1, `${m.largeurPage} px pour ${largeur}`)
      }
      verifier(
        'aucun lien ne prend le bleu par défaut des messageries',
        m.liensBleus.length === 0,
        m.liensBleus.join(' | '),
      )
      verifier(
        'tous les liens mènent au site du cinéma, ou à son adresse',
        m.liens.length > 0 && m.liens.every((h) => /^(https:\/\/www\.zinema\.ch|mailto:)/.test(h)),
      )
      /* Le collage ne doit rien perdre du texte : l'abonné lit ce que
         montrait l'aperçu du Studio, mot pour mot. */
      const normal = (t) => t.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
      if (texteDeReference === null) texteDeReference = normal(m.texte)
      else {
        verifier(
          "le texte est mot pour mot celui de l'aperçu du Studio",
          normal(m.texte) === texteDeReference,
          premiereDifference(normal(m.texte), texteDeReference),
        )
      }
      console.log('')
    }
  }
} finally {
  await navigateur.close()
}

function premiereDifference(a, b) {
  let i = 0
  while (i < a.length && a[i] === b[i]) i += 1
  return `…${a.slice(Math.max(0, i - 40), i + 40)}…\n      au lieu de …${b.slice(Math.max(0, i - 40), i + 40)}…`
}

console.log(
  `${reussites} vérification${reussites > 1 ? 's' : ''} passée${reussites > 1 ? 's' : ''}` +
    (echecs ? `, ${echecs} en échec.\n` : '.\n'),
)
if (echecs > 0) {
  console.error("La newsletter ne s'affiche plus comme il faut dans une messagerie. Rien n'est publié.\n")
  process.exit(1)
}
