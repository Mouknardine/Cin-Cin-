/* ============================================================
   « Annuler » et « Vider la semaine », vérifiés.

   Un bouton qui promet de revenir en arrière doit revenir EXACTEMENT
   en arrière : les séances supprimées reviennent avec leur identité,
   celles créées depuis disparaissent, les modifiées reprennent leurs
   champs, brouillons compris. Et vider une semaine ne doit jamais
   emporter une séance dont des billets sont vendus.

   Le vrai code du Studio (utils/historique.ts, utils/vider.ts) tourne
   ici sur un faux Sanity en mémoire : rien ne touche aux vraies données.

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

const {photographier, restaurer, semainesDe} = await chargerModule(
  '../sanity/plugins/planification/utils/historique.ts',
)
const {inventorier, supprimerSeances} = await chargerModule(
  '../sanity/plugins/planification/utils/vider.ts',
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

/* ------------------------------------------------------------------
   Un faux Sanity : une table de documents, les trois requêtes que ces
   fichiers envoient, et des transactions qui passent en entier ou pas
   du tout — y compris le refus de supprimer une séance qui a des billets.
   ------------------------------------------------------------------ */
function fauxSanity(documents) {
  const base = new Map(documents.map((d) => [d._id, structuredClone(d)]))
  const dansLaPeriode = ({debut, fin}) =>
    [...base.values()].filter((d) => d._type === 'screening' && d.date && d.date >= debut && d.date <= fin)

  const client = {
    base,
    withConfig: () => client,
    async fetch(requete, params) {
      if (requete.includes('_type == "commande"')) {
        return [...base.values()]
          .filter((d) => d._type === 'commande' && params.seances.includes(d.seance?._ref))
          .map((d) => d.seance._ref)
      }
      const trouves = dansLaPeriode(params)
      return requete.trim().endsWith('._id') ? trouves.map((d) => d._id) : trouves.map((d) => structuredClone(d))
    },
    transaction() {
      const operations = []
      const transaction = {
        create(doc) {
          operations.push(() => {
            const _id = doc._id ?? `nouvelle-${Math.random().toString(36).slice(2)}`
            base.set(_id, {...doc, _id, _rev: 'r1'})
          })
          return transaction
        },
        createOrReplace(doc) {
          operations.push(() => base.set(doc._id, {...structuredClone(doc), _rev: 'r2'}))
          return transaction
        },
        delete(id) {
          operations.push(() => {
            const reference = [...base.values()].some((d) => d._type === 'commande' && d.seance?._ref === id)
            if (reference) throw new Error(`${id} est désignée par une commande`)
            base.delete(id)
          })
          return transaction
        },
        patch(id, fn) {
          operations.push(() => {
            let champs = {}
            fn({set: (valeurs) => ((champs = valeurs), null)})
            base.set(id, {...base.get(id), ...champs})
          })
          return transaction
        },
        async commit() {
          const copie = new Map([...base].map(([k, v]) => [k, structuredClone(v)]))
          try {
            for (const operation of operations) operation()
          } catch (erreur) {
            base.clear()
            for (const [k, v] of copie) base.set(k, v)
            throw erreur
          }
        },
      }
      return transaction
    },
  }
  return client
}

const seance = (_id, date, time, room, film = 'film-a') => ({
  _id, _type: 'screening', date, time, room, film: {_type: 'reference', _ref: film}, status: 'disponible',
  _rev: 'r0', _createdAt: '2026-09-01T00:00:00Z', _updatedAt: '2026-09-01T00:00:00Z',
})

/** L'état comparable d'une semaine : les séances et leurs champs, sans ce que Sanity gère seul. */
function etat(client, periode) {
  return JSON.stringify(
    [...client.base.values()]
      .filter((d) => d._type === 'screening' && d.date >= periode.debut && d.date <= periode.fin)
      .map(({_rev, _createdAt, _updatedAt, ...champs}) => champs)
      .sort((a, b) => a._id.localeCompare(b._id)),
  )
}

console.log('\nAnnuler et vider la semaine')

const SEMAINE = semainesDe('2026-10-09')
verifier(
  'La semaine d’un vendredi va du mercredi au mardi',
  SEMAINE.debut === '2026-10-07' && SEMAINE.fin === '2026-10-13',
  JSON.stringify(SEMAINE),
)
const DEUX = semainesDe('2026-10-14', '2026-10-01')
verifier('Plusieurs dates couvrent toutes leurs semaines', DEUX.debut === '2026-09-30' && DEUX.fin === '2026-10-20')

function semaineDeTest() {
  return fauxSanity([
    seance('a', '2026-10-07', '19:00', 'Salle 1'),
    seance('b', '2026-10-09', '21:15', 'Salle 1', 'film-kalari'),
    {...seance('drafts.b', '2026-10-09', '21:15', 'Salle 1', 'film-kalari'), time: '21:30'},
    seance('c', '2026-10-11', '17:00', 'Salle 2'),
    seance('vendue', '2026-10-10', '19:00', 'Salle 2'),
    seance('ailleurs', '2026-10-20', '19:00', 'Salle 1'),
    {_id: 'commande-1', _type: 'commande', seance: {_type: 'reference', _ref: 'vendue'}},
  ])
}

/* ---- Vider, puis annuler ---- */
{
  const client = semaineDeTest()
  const avant = etat(client, SEMAINE)
  const inventaire = await inventorier(client, SEMAINE)
  verifier(
    'L’inventaire garde la séance qui a des billets',
    inventaire.avecBillets.join() === 'vendue' && !inventaire.aSupprimer.includes('vendue'),
    JSON.stringify(inventaire),
  )
  verifier('Un brouillon et sa version publiée comptent pour une seule séance', inventaire.aSupprimer.filter((id) => id === 'b').length === 1)

  const photo = await photographier(client, 'vider la semaine', SEMAINE)
  await supprimerSeances(client, inventaire.aSupprimer)
  verifier(
    'Vider la semaine ne laisse que la séance vendue',
    etat(client, SEMAINE).includes('"vendue"') && !client.base.has('a') && !client.base.has('drafts.b'),
  )
  verifier('Vider une semaine ne touche pas aux autres', client.base.has('ailleurs'))

  await restaurer(client, photo)
  verifier('Annuler fait revenir la semaine exactement', etat(client, SEMAINE) === avant, etat(client, SEMAINE))
  verifier('Le brouillon revient avec son heure à lui', client.base.get('drafts.b')?.time === '21:30')
}

/* ---- Créer, déplacer, puis annuler ---- */
{
  const client = semaineDeTest()
  const avant = etat(client, SEMAINE)
  const photo = await photographier(client, 'déplacer une séance', SEMAINE)
  await client.transaction().patch('b', (p) => p.set({time: '21:00', room: 'Salle 2'})).commit()
  await client.transaction().create({_type: 'screening', date: '2026-10-08', time: '19:00', room: 'Salle 1'}).commit()
  verifier('Le geste a bien eu lieu', etat(client, SEMAINE) !== avant)
  await restaurer(client, photo)
  verifier('Annuler retire la séance créée et remet l’heure d’avant', etat(client, SEMAINE) === avant, etat(client, SEMAINE))
}

/* ---- Une annulation impossible ne casse rien ---- */
{
  const client = semaineDeTest()
  const photo = await photographier(client, 'créer une séance', SEMAINE)
  await client.transaction().create({_id: 'neuve', _type: 'screening', date: '2026-10-08', time: '19:00', room: 'Salle 1'}).commit()
  /* Entre-temps, un spectateur a acheté une place pour la séance neuve. */
  client.base.set('commande-2', {_id: 'commande-2', _type: 'commande', seance: {_type: 'reference', _ref: 'neuve'}})
  const pendant = etat(client, SEMAINE)
  let refusee = false
  try {
    await restaurer(client, photo)
  } catch {
    refusee = true
  }
  verifier('Une séance vendue entre-temps bloque l’annulation', refusee)
  verifier('Une annulation refusée ne laisse rien à moitié fait', etat(client, SEMAINE) === pendant)
}

console.log(
  `\n${reussites} vérification${reussites > 1 ? 's' : ''} passée${reussites > 1 ? 's' : ''}` +
    (echecs ? `, ${echecs} en échec.\n` : '.\n'),
)

if (echecs > 0) {
  console.error('« Annuler » ou « Vider la semaine » ne tient plus sa promesse.\n')
  process.exit(1)
}
