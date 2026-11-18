/* ============================================================
   Zinéma — ranger dans le dossier privé les commandes publiques.

   Une commande porte l'e-mail de l'acheteur et la référence de son
   billet, qui suffit à entrer en salle. Elle doit avoir un
   identifiant à point (« commandes.… ») : sans clé, Sanity ne la
   montre alors à personne. Ce script sert si une commande s'est
   retrouvée avec un identifiant sans point, donc lisible par
   n'importe qui (la tâche GitHub « Commandes privées » le signale).
   Il a servi une première fois le 18 novembre 2026, pour 88
   commandes.

   Chaque commande est recopiée sous « commandes.<ancien
   identifiant> », puis l'originale est supprimée, dans une même
   transaction : jamais de commande perdue, jamais de doublon. Les
   références ne changent pas : les billets restent valables.

   Si le serveur modifie une commande pendant le déplacement (un
   paiement qui se conclut), sa transaction est refusée et elle
   reste à sa place : relancer le script la déplace avec ses données
   à jour. Si sa copie privée existe déjà, la transaction est
   refusée aussi : rien n'est effacé.

   Le script s'arrête sans rien toucher s'il trouve un brouillon de
   commande, ou deux commandes avec la même référence ou le même
   paiement SumUp (une copie faite avec le bouton « Dupliquer » d'un
   ancien onglet du Studio) : c'est à une personne de décider quoi
   en faire. Sans cet arrêt, le serveur compterait les places deux
   fois et pourrait conclure le billet sur la copie.

   Rien n'est affiché des données personnelles : seulement des
   nombres et des identifiants techniques.

   Avant de lancer pour de vrai : faire une sauvegarde, rangée HORS
   du dépôt (elle contient des données personnelles), par exemple
     npx sanity dataset export production ../sauvegardes/sanity-production-AAAA-MM-JJ.tar.gz --no-assets

   Essai à blanc :  npx sanity exec sanity/maintenance/deplacer-commandes.mjs --with-user-token
   Pour de vrai :   npx sanity exec sanity/maintenance/deplacer-commandes.mjs --with-user-token -- --appliquer
   ============================================================ */

/* sanity/cli est publié en CommonJS : sa fonction est sur l'export par défaut. */
import sanityCli from "sanity/cli";

const { getCliClient } = sanityCli;

const PREFIXE = "commandes.";
const APPLIQUER = process.argv.includes("--appliquer");
const client = getCliClient({ apiVersion: "2024-01-01", useCdn: false, perspective: "raw" });

/* path("*") ne retient que les identifiants sans point : les seuls
   que Sanity montre sans clé. */
const PUBLIQUES = `*[_type == "commande" && _id in path("*")]`;
const AUTRES_HORS_DOSSIER = `*[_type == "commande" && !(_id in path("*")) && !(_id in path("${PREFIXE}**"))]._id`;
const DOUBLONS = `${PUBLIQUES}{
  _id,
  "memes": *[_type == "commande" && _id != ^._id && (
    reference == ^.reference || (defined(^.sumupCheckoutId) && sumupCheckoutId == ^.sumupCheckoutId)
  )]._id
}[count(memes) > 0]`;

const publiques = await client.fetch(PUBLIQUES);
const inattendues = await client.fetch(AUTRES_HORS_DOSSIER);
const doublons = await client.fetch(DOUBLONS);

console.log(`Commandes publiques : ${publiques.length}`);
if (inattendues.length > 0) {
  console.log(`Arrêt, rien n'a été modifié : ${inattendues.length} commande(s) hors du dossier privé avec un identifiant inattendu (brouillon ?) :`);
  inattendues.forEach((id) => console.log(`  ${id}`));
  process.exit(1);
}
if (doublons.length > 0) {
  console.log(`Arrêt, rien n'a été modifié : ${doublons.length} commande(s) publique(s) en double (même référence ou même paiement). Supprimer la copie dans le Studio, puis relancer :`);
  doublons.forEach((doc) => console.log(`  ${doc._id} = ${doc.memes.join(", ")}`));
  process.exit(1);
}
if (publiques.length === 0) {
  console.log("Rien à déplacer.");
  process.exit(0);
}
if (!APPLIQUER) {
  console.log("Essai à blanc : rien n'a été modifié. Ce qui serait fait, par exemple :");
  publiques.slice(0, 3).forEach((doc) => console.log(`  ${doc._id} → ${PREFIXE}${doc._id}`));
  process.exit(0);
}

let deplacees = 0;
const refusees = [];
for (const doc of publiques) {
  const { _id, _rev, _createdAt, _updatedAt, ...champs } = doc;
  try {
    await client
      .transaction()
      /* Garde-fou : la transaction entière échoue si la commande a
         changé depuis qu'on l'a lue. */
      .patch(_id, { ifRevisionID: _rev, set: { statut: doc.statut } })
      /* « create » et non « createIfNotExists » : si la copie existe
         déjà, tout est refusé plutôt que d'effacer l'originale. */
      .create({ ...champs, _id: `${PREFIXE}${_id}` })
      .delete(_id)
      .commit({ visibility: "sync" });
    deplacees += 1;
  } catch (erreur) {
    refusees.push(`${_id} (${erreur.statusCode ?? "?"})`);
  }
}

const restantes = await client.fetch(`count(${PUBLIQUES})`);
console.log(`Déplacées : ${deplacees}`);
console.log(`Encore publiques : ${restantes}`);
if (refusees.length > 0) {
  console.log("Refusées (relancer le script) :");
  refusees.forEach((ligne) => console.log(`  ${ligne}`));
  process.exit(1);
}
