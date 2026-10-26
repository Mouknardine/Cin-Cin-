/**
 * Plugin « Planification » : ajoute un onglet dédié dans le Studio
 * pour programmer les séances en masse, dupliquer des semaines
 * et repérer les conflits de salle.
 */
import {CalendarIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'

import {programmerSeances} from './actions/programmerSeances'
import {publierAvecProjection} from './actions/publierAvecProjection'
import {PlanificationTool} from './components/PlanificationTool'

export const planification = definePlugin({
  name: 'planification',
  tools: [
    {
      name: 'planification',
      title: 'Planification',
      icon: CalendarIcon,
      component: PlanificationTool,
    },
  ],
  document: {
    /* Sur une fiche de film, le menu « ⋮ » à côté de Publish propose de
       programmer toutes ses séances d'un coup — et Publish lui-même
       programme la séance d'une avant-première ou d'une première,
       d'après le jour et l'heure écrits dans la fiche. */
    actions: (actions, contexte) =>
      contexte.schemaType === 'film'
        ? [
            ...actions.map((action) =>
              action.action === 'publish' ? publierAvecProjection(action) : action,
            ),
            programmerSeances,
          ]
        : actions,
  },
})
