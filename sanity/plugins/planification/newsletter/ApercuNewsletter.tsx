/**
 * L'aperçu du message, tel que l'abonné le recevra : la page complète, dans
 * un cadre isolé du Studio pour que ses styles ne s'y mêlent pas.
 */
import {Card} from '@sanity/ui'

interface Props {
  page: string
  titre: string
  /** La hauteur du cadre ; le message défile à l'intérieur. */
  hauteur?: string
}

export function ApercuNewsletter({page, titre, hauteur = '62vh'}: Props): React.JSX.Element {
  return (
    <Card radius={2} shadow={1} style={{overflow: 'hidden'}}>
      <iframe
        title={titre}
        srcDoc={page}
        style={{display: 'block', width: '100%', height: hauteur, border: 0, background: '#ffffff'}}
      />
    </Card>
  )
}
