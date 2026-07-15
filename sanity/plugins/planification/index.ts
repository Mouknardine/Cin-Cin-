/**
 * Plugin « Planification » : ajoute un onglet dédié dans le Studio
 * pour programmer les séances en masse, dupliquer des semaines
 * et repérer les conflits de salle.
 */
import {CalendarIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'

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
})
