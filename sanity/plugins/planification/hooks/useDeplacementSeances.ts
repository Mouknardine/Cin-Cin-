/**
 * Le glisser-déposer du planning : prendre une séance, la poser ailleurs.
 *
 * Deux gestes, un seul mouvement en base :
 *
 *   - sur une case libre    → la séance déménage ;
 *   - sur une case occupée  → les deux séances échangent leurs places.
 *
 * Un déplacement à la main est un acte VOULU : contrairement aux
 * assistants qui créent des séances en masse, il n'est jamais refusé.
 * Ce qui suit s'en charge : `onFait` remet les soirées d'aplomb —
 * un long film posé à 19 h repousse la séance de 21 h de sa salle — et
 * ce qui se chevauche encore s'affiche en rouge dans la grille.
 */
import {useCallback, useState} from 'react'
import {useClient} from 'sanity'
import {useToast} from '@sanity/ui'

import {API_VERSION, type CreneauDate, type GlisserDeposer, type SeancePlanning} from '../types'
import {type Deplacement, deplacerSeances} from '../utils/deplacements'
import {formatJourCourt} from '../utils/dates'

export function useDeplacementSeances(onFait: () => void): GlisserDeposer {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const [seanceGlissee, setSeanceGlissee] = useState<SeancePlanning | null>(null)

  const onDebut = useCallback((seance: SeancePlanning) => setSeanceGlissee(seance), [])
  const onFin = useCallback(() => setSeanceGlissee(null), [])

  const onDeposer = useCallback(
    async (creneau: CreneauDate, occupant: SeancePlanning | null) => {
      const portee = seanceGlissee
      setSeanceGlissee(null)
      if (!portee) return

      const deplacements: Deplacement[] = [{id: portee._id, vers: creneau}]
      if (occupant) {
        /* L'échange est un seul mouvement : les deux séances passent par
           l'instant où leurs horaires se croisent sans jamais rester à
           moitié permutées. */
        deplacements.push({
          id: occupant._id,
          vers: {date: portee.date, heure: portee.heure, salle: portee.salle},
        })
      }

      try {
        await deplacerSeances(client, deplacements)
        toast.push({
          status: 'success',
          title: occupant
            ? `« ${portee.filmTitre} » et « ${occupant.filmTitre} » ont échangé leurs places.`
            : `« ${portee.filmTitre} » déplacée au ${formatJourCourt(creneau.date)} ${creneau.heure} (${creneau.salle}).`,
        })
        onFait()
      } catch {
        toast.push({status: 'error', title: 'Le déplacement a échoué. Réessayez.'})
      }
    },
    [client, onFait, seanceGlissee, toast],
  )

  return {seanceGlissee, onDebut, onFin, onDeposer}
}
