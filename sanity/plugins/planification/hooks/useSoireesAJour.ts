/**
 * Après chaque modification : remettre les soirées d'aplomb, puis relire
 * la semaine.
 *
 * Un film plus long posé à 19 h repousse la séance de 21 h de sa salle,
 * au quart d'heure qui suit la fin du premier ; un film plus court la
 * ramène à 21 h. Plutôt que de prévoir ce
 * décalage dans chacun des gestes possibles — déplacer, échanger,
 * remplacer un film, en créer une, en générer vingt-huit — on relit la
 * semaine après coup et on corrige ce qui doit l'être. La règle ne peut
 * ainsi pas être oubliée par un chemin.
 *
 * La même relecture a lieu À L'OUVERTURE d'une semaine en cours ou à
 * venir. Une semaine dupliquée, ou remplie depuis une autre, est créée
 * sans être affichée : c'est en l'ouvrant qu'elle se remet d'aplomb
 * (signalé par le cinéma, 29 septembre 2026 — la semaine du 7 octobre
 * avait recopié un 21:15 devenu faux). Les semaines passées ne sont
 * jamais retouchées.
 */
import {useCallback, useEffect, useRef} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

import {API_VERSION} from '../types'
import {recalerLesSoirees} from '../utils/deplacements'
import {aujourdHui} from '../utils/dates'
import {resumerRecalages} from '../utils/enchainement'

export function useSoireesAJour(
  debutSemaine: string,
  finSemaine: string,
  recharger: () => void,
): () => void {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const rafraichir = useCallback(async () => {
    try {
      const recalages = await recalerLesSoirees(client, debutSemaine, finSemaine)
      if (recalages.length > 0) {
        const nombre = recalages.length
        toast.push({
          status: 'info',
          title: `${nombre} séance${nombre > 1 ? 's' : ''} remise${
            nombre > 1 ? 's' : ''
          } à l'heure, d'après la fin du film d'avant.`,
          description: resumerRecalages(recalages),
          duration: 9000,
        })
      }
    } catch {
      toast.push({
        status: 'warning',
        title: "Les horaires n'ont pas pu être réajustés : vérifiez les séances en rouge.",
      })
    }
    recharger()
  }, [client, debutSemaine, finSemaine, recharger, toast])

  /* Une fois par semaine ouverte, pas à chaque rendu. */
  const semaineRelue = useRef<string | null>(null)
  useEffect(() => {
    if (semaineRelue.current === debutSemaine) return
    semaineRelue.current = debutSemaine
    if (finSemaine < aujourdHui()) return
    void rafraichir()
  }, [debutSemaine, finSemaine, rafraichir])

  return rafraichir
}
