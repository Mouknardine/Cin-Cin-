/**
 * Bilan affiché après une création en masse :
 * séances créées, doublons ignorés et conflits de salle écartés.
 */
import {CheckmarkCircleIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import type {RapportCreation} from '../types'

export function RapportResultat({rapport}: {rapport: RapportCreation}): React.JSX.Element {
  return (
    <Stack space={3}>
      <Card padding={3} radius={2} tone={rapport.creees > 0 ? 'positive' : 'caution'}>
        <Flex gap={2} align="center">
          <Text size={1}>
            <CheckmarkCircleIcon />
          </Text>
          <Text size={1} weight="semibold">
            {rapport.creees === 0
              ? 'Aucune séance créée.'
              : `${rapport.creees} séance${rapport.creees > 1 ? 's' : ''} créée${
                  rapport.creees > 1 ? 's' : ''
                } et publiée${rapport.creees > 1 ? 's' : ''}.`}
          </Text>
        </Flex>
      </Card>

      {rapport.doublons > 0 && (
        <Card padding={3} radius={2} tone="transparent" border>
          <Flex gap={2} align="center">
            <Text size={1} muted>
              <InfoOutlineIcon />
            </Text>
            <Text size={1} muted>
              {rapport.doublons} séance{rapport.doublons > 1 ? 's' : ''} déjà existante
              {rapport.doublons > 1 ? 's' : ''} (ignorée{rapport.doublons > 1 ? 's' : ''}).
            </Text>
          </Flex>
        </Card>
      )}

      {rapport.conflits.length > 0 && (
        <Card padding={3} radius={2} tone="critical">
          <Stack space={3}>
            <Flex gap={2} align="center">
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Text size={1} weight="semibold">
                {rapport.conflits.length} séance{rapport.conflits.length > 1 ? 's' : ''} non créée
                {rapport.conflits.length > 1 ? 's' : ''} (salle déjà occupée) :
              </Text>
            </Flex>
            {rapport.conflits.map((conflit) => (
              <Text key={conflit} size={1}>
                • {conflit}
              </Text>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
