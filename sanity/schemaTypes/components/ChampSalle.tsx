/**
 * Le champ « Salle » d'une séance.
 *
 * Les salles ne sont plus les mêmes partout : chaque cinéma déclare
 * les siennes dans sa fiche. La liste proposée ici est donc celle du
 * cinéma choisi juste au-dessus, lue au moment où on ouvre le champ.
 *
 * Trois situations, trois réponses claires :
 *   - aucun cinéma choisi : on le dit, il n'y a rien à proposer ;
 *   - un cinéma sans salle : on renvoie vers sa fiche ;
 *   - une séance qui garde le nom d'une salle disparue : le nom reste
 *     affiché et signalé, plutôt que de s'effacer en silence.
 */
import {Card, Select, Stack, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {set, unset, useClient, useFormValue, type StringInputProps} from 'sanity'

const API_VERSION = '2024-06-01'

/** Les salles d'un cinéma, sa fiche publiée d'abord, son brouillon sinon. */
const REQUETE_SALLES = `{
  "publie": *[_id == $id][0].salles[].nom,
  "brouillon": *[_id == $brouillon][0].salles[].nom
}`

export function ChampSalle(props: StringInputProps): React.JSX.Element {
  const {value, onChange, readOnly} = props
  const client = useClient({apiVersion: API_VERSION})
  const cinemaRef = useFormValue(['cinema', '_ref']) as string | undefined
  const [salles, setSalles] = useState<string[] | null>(null)

  useEffect(() => {
    if (!cinemaRef) {
      setSalles(null)
      return
    }
    let annule = false
    client
      .fetch<{publie: string[] | null; brouillon: string[] | null}>(REQUETE_SALLES, {
        id: cinemaRef,
        brouillon: `drafts.${cinemaRef}`,
      })
      .then((reponse) => {
        if (annule) return
        const liste = reponse?.publie ?? reponse?.brouillon ?? []
        setSalles(liste.filter(Boolean))
      })
      .catch(() => {
        /* Sanity injoignable : on n'invente pas de salles, on laisse la
           liste vide et le message qui va avec. */
        if (!annule) setSalles([])
      })
    return () => {
      annule = true
    }
  }, [client, cinemaRef])

  if (!cinemaRef) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>Choisissez d'abord le cinéma : les salles proposées sont les siennes.</Text>
      </Card>
    )
  }

  if (salles === null) {
    return (
      <Text size={1} muted>
        Chargement des salles…
      </Text>
    )
  }

  if (salles.length === 0) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>
          Ce cinéma n'a encore aucune salle. Ajoutez-les dans sa fiche, sous « Tarifs & salles ».
        </Text>
      </Card>
    )
  }

  /* Une séance plus ancienne peut porter le nom d'une salle qui a été
     renommée : on garde ce nom dans la liste pour ne pas le perdre,
     mais on dit qu'il ne correspond plus à rien. */
  const salleInconnue = Boolean(value) && !salles.includes(value as string)

  return (
    <Stack space={3}>
      <Select
        value={value ?? ''}
        readOnly={readOnly}
        onChange={(evenement) => {
          const choix = evenement.currentTarget.value
          onChange(choix ? set(choix) : unset())
        }}
      >
        <option value="">— Choisir une salle —</option>
        {salles.map((salle) => (
          <option key={salle} value={salle}>
            {salle}
          </option>
        ))}
        {salleInconnue && (
          <option value={value as string}>{value} (salle inconnue de ce cinéma)</option>
        )}
      </Select>
      {salleInconnue && (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>
            « {value} » ne figure pas parmi les salles de ce cinéma. La caisse en ligne ne saura pas
            compter les places : choisissez une salle existante.
          </Text>
        </Card>
      )}
    </Stack>
  )
}
