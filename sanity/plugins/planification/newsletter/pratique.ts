/**
 * Le bloc « Infos » : tarifs, billets, salles.
 */
import {PARRAIN_DE_SALLE, SALLES, rangDeSalle, type NomDeSalle} from '../../../salles'
import type {ReglagesNewsletter} from './donnees'
import {ENCRE, GRIS, JAUNE, SITE, TAILLE, bandeau, cellule, echapper, sansLienAutomatique, tableau} from './html'

function ligneDeTarif(montant: number | null, libelle: string): string {
  if (montant === null) return ''
  return `<tr>${cellule(
    `${echapper(montant)}.–`,
    `background-color:${JAUNE};color:${ENCRE};padding:8px;width:56px;` +
      `font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;text-align:center;`,
    'width="56"',
  )}${cellule(echapper(libelle), `padding:8px 12px;font-size:${TAILLE.texte};line-height:1.45;`)}</tr>`
}

/** Le parrain sans ses précisions entre parenthèses : « Thierry Jobin », pas
    « Thierry Jobin (ex-Le Temps, fiff.ch) ». La newsletter ne garde que le nom. */
function nomDuParrain(nomDeSalle: string): string {
  if (!(SALLES as readonly string[]).includes(nomDeSalle)) return ''
  return PARRAIN_DE_SALLE[nomDeSalle as NomDeSalle].replace(/\s*\([^)]*\)/g, '').trim()
}

/* Les salles viennent des réglages pour leur nombre de places, et de
   sanity/salles.ts pour leur parrain — deux sources, une seule ligne. Tout
   reste du texte, jamais un lien que la messagerie fabriquerait d'elle-même. */
function listeDesSalles(salles: ReglagesNewsletter['salles']): string {
  return [...(salles ?? [])]
    .sort((a, b) => rangDeSalle(a?.nom) - rangDeSalle(b?.nom))
    .map((salle) => {
      const nom = String(salle?.nom ?? '')
      const parrain = nomDuParrain(nom)
      const details = [parrain, salle?.places ? `${salle.places} places` : '']
        .filter(Boolean)
        .map((morceau) => sansLienAutomatique(echapper(morceau)))
        .join(' — ')
      return `<b style="color:${ENCRE};">${echapper(nom)}</b>${details ? ` — ${details}` : ''}`
    })
    .join('<br>')
}

export function blocPratique(reglages: ReglagesNewsletter): string {
  const conditions = (reglages.conditionsReduit ?? []).join(', ')
  const salles = listeDesSalles(reglages.salles)

  /* Ce qui était écrit ici — « pas de cartes bancaires, pas de réservations »
     — datait d'avant l'ouverture de la billetterie en ligne, le 8 septembre
     2026. C'était devenu faux, et surtout dissuasif : on annonçait aux
     abonnés qu'ils ne pouvaient pas réserver, sur le message même qui aurait
     dû les y conduire. */
  const billets = `<tr>${cellule(
    `<b>Billets en ligne sur <a href="${SITE}" style="color:${ENCRE};">zinema.ch</a></b>, ` +
      `ou à la buvette 15 minutes avant les séances.`,
    `padding:8px 12px;font-size:${TAILLE.texte};line-height:1.5;`,
    'colspan="2"',
  )}</tr>`

  const lignesDesSalles = salles
    ? `<tr>${cellule(
        salles,
        `padding:8px 12px;font-size:${TAILLE.petit};line-height:1.65;color:${GRIS};`,
        'colspan="2"',
      )}</tr>`
    : ''

  return (
    bandeau('Infos') +
    `<tr>${cellule(
      tableau(
        ligneDeTarif(reglages.tarifPlein, 'Tarif ordinaire') +
          ligneDeTarif(reglages.tarifReduit, conditions || 'Tarif réduit') +
          billets +
          lignesDesSalles,
      ),
      'padding:0;',
    )}</tr>`
  )
}
