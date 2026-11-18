/* Les actions du Studio à retirer, selon le type du document.

   Ce fichier n'importe rien : verifications/actions-studio.mjs le
   lit directement avec Node, sans lancer le Studio. */

/* Les fiches uniques (Réglages, Abonnements, Textes des pages)
   existent en un seul exemplaire : ni copie, ni suppression, ni
   retrait du site. */
const ACTIONS_FICHE_UNIQUE: readonly string[] = ["duplicate", "delete", "unpublish"];

/* Une commande ne se duplique pas. Le Studio donnerait à la copie un
   identifiant sans point : une fois publiée, elle serait lisible par
   n'importe qui, avec l'e-mail de l'acheteur et la référence de son
   billet (voir PREFIXE_COMMANDE_PRIVEE dans api/_billetterie.php).
   Même en brouillon, le serveur pourrait conclure le paiement sur la
   copie et laisser l'original « en attente ». Elle ne se dépublie pas
   non plus : seul le serveur range les commandes. */
const ACTIONS_COMMANDE: readonly string[] = ["duplicate", "unpublish"];

export function actionsRetirees(
  schemaType: string,
  typesUniques: readonly string[]
): readonly string[] {
  if (typesUniques.includes(schemaType)) return ACTIONS_FICHE_UNIQUE;
  if (schemaType === "commande") return ACTIONS_COMMANDE;
  return [];
}
