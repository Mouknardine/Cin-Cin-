/**
 * Les gestes qui font sortir un message du Studio — le copier, en copier le
 * code ou l'objet, le télécharger —, chacun suivi d'un message qui dit s'il
 * a marché. Les deux envois s'en servent : la newsletter du lundi et la
 * piqûre de rappel.
 */
import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {copierEnRiche, copierTexte, documentComplet, telechargerHtml} from './presse-papier'

export interface Sortie {
  /** La page complète. Elle sert trois fois : l'aperçu, le code HTML, le
      fichier. On voit donc exactement ce que l'abonné recevra. */
  page: string
  copier: () => void
  copierCode: () => void
  copierObjet: () => void
  telecharger: () => void
}

export function useSortie(html: string, objet: string, nomDeFichier: string): Sortie {
  const toast = useToast()
  const page = useMemo(() => (html ? documentComplet(objet, html) : ''), [html, objet])

  const signaler = useCallback(
    (geste: () => Promise<void>, reussite: string, echec: string, detail?: string): void => {
      geste().then(
        () => toast.push({status: 'success', title: reussite, description: detail}),
        () => toast.push({status: 'error', title: echec}),
      )
    },
    [toast],
  )

  const copier = useCallback(
    () =>
      signaler(
        () => copierEnRiche(html),
        'Newsletter copiée.',
        'La copie a échoué. Utilisez « Télécharger », puis ouvrez le fichier et copiez-le.',
        'Collez-la dans votre message, la mise en page suit.',
      ),
    [html, signaler],
  )
  const copierCode = useCallback(
    () =>
      signaler(
        () => copierTexte(page),
        'Code HTML copié.',
        'La copie du code a échoué. Utilisez « Télécharger ».',
        'Collez-le dans le bloc « HTML » de votre outil d’envoi.',
      ),
    [page, signaler],
  )
  const copierObjet = useCallback(
    () => signaler(() => copierTexte(objet), 'Objet copié.', "La copie de l'objet a échoué."),
    [objet, signaler],
  )
  const telecharger = useCallback(() => {
    try {
      telechargerHtml(nomDeFichier, page)
    } catch {
      toast.push({status: 'error', title: 'Le téléchargement a échoué. Réessayez, ou copiez le code HTML.'})
    }
  }, [nomDeFichier, page, toast])

  return {page, copier, copierCode, copierObjet, telecharger}
}
