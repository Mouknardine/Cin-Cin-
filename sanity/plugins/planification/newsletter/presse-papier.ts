/**
 * Faire sortir la newsletter du Studio : la copier, en copier le code, ou la
 * télécharger.
 *
 * Trois chemins, parce que les outils d'envoi n'acceptent pas tous la même
 * chose : un éditeur de texte riche veut la mise en page collée, un bloc
 * « HTML » veut le code, et un fichier sert quand le presse-papier refuse.
 */
import {echapper} from './html'

/** Le temps laissé au navigateur pour lancer le téléchargement avant de libérer le fichier. */
const DELAI_LIBERATION_MS = 60_000

/**
 * Une version texte, pour les messageries qui refusent le HTML — et pour
 * que le presse-papier ne soit jamais vide si le collage riche échoue.
 */
function enTexteBrut(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/(tr|div|p|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '→')
    .replace(/&#8203;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Le message dans une page complète : pour le code HTML et pour le fichier téléchargé. */
export function documentComplet(objet: string, html: string): string {
  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${echapper(objet)}</title></head>` +
    `<body style="margin:0;padding:0;background-color:#ffffff;">${html}</body></html>`
  )
}

/**
 * Copie en conservant la mise en forme.
 *
 * On passe par l'API presse-papier quand elle existe : c'est la seule qui
 * sache déposer du HTML ET du texte, et laisser l'outil d'envoi choisir. Sinon
 * on retombe sur la vieille méthode — un bloc invisible qu'on sélectionne et
 * qu'on copie —, qui garde elle aussi la mise en forme.
 */
export async function copierEnRiche(html: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], {type: 'text/html'}),
        'text/plain': new Blob([enTexteBrut(html)], {type: 'text/plain'}),
      }),
    ])
    return
  }

  const support = document.createElement('div')
  support.innerHTML = html
  /* Hors de l'écran mais dans la page : une sélection ne porte que sur ce
     qui est rendu. `position:fixed` évite de faire sauter le défilement. */
  support.setAttribute('style', 'position:fixed;left:-99999px;top:0;white-space:normal;')
  document.body.appendChild(support)
  try {
    const selection = window.getSelection()
    const plage = document.createRange()
    plage.selectNodeContents(support)
    selection?.removeAllRanges()
    selection?.addRange(plage)
    const copie = document.execCommand('copy')
    selection?.removeAllRanges()
    if (!copie) throw new Error('copie refusée')
  } finally {
    support.remove()
  }
}

/** Copie un texte tel quel : l'objet du message, ou le code HTML. */
export async function copierTexte(texte: string): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error('presse-papier indisponible')
  await navigator.clipboard.writeText(texte)
}

/** Télécharge un fichier HTML. */
export function telechargerHtml(nomDeFichier: string, contenu: string): void {
  const adresse = URL.createObjectURL(new Blob([contenu], {type: 'text/html;charset=utf-8'}))
  const lien = document.createElement('a')
  lien.href = adresse
  lien.download = nomDeFichier
  lien.click()
  window.setTimeout(() => URL.revokeObjectURL(adresse), DELAI_LIBERATION_MS)
}
