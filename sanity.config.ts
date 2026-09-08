import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes, typesNonCreables, typesUniques } from "./sanity/schemaTypes";
import { deskStructure } from "./sanity/deskStructure";
import { planification } from "./sanity/plugins/planification";

// Ce fichier est chargé par la CLI Sanity ("npm run studio:dev" /
// "studio:deploy"), un outil séparé (Vite) du site, qui n'est fait
// que de fichiers HTML/CSS/JS. D'où le préfixe SANITY_STUDIO_
// (convention Sanity) plutôt que NEXT_PUBLIC_ — même valeur, deux
// variables à définir dans .env.local.
/* Fixe, pour la même raison que dans sanity.cli.ts : un .env.local oublié
   ne doit pas pouvoir faire éditer le mauvais projet sans prévenir. */
const projectId = "vle63mzm";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2024-06-01";

export default defineConfig({
  name: "zinema",
  title: "Zinéma",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Retire des modèles de création les fiches uniques (Réglages,
    // Abonnements, Textes des pages) et les commandes de billetterie,
    // créées par le serveur : on ne peut pas en faire de doublon par
    // mégarde.
    templates: (modeles) =>
      modeles.filter((modele) => !typesNonCreables.includes(modele.schemaType)),
  },
  document: {
    // Le bouton « + » ne propose que ce qui se crée vraiment à la main.
    newDocumentOptions: (options) =>
      options.filter((option) => !typesNonCreables.includes(option.templateId)),
    // Les fiches uniques ne peuvent être ni dupliquées ni supprimées.
    actions: (actions, { schemaType }) =>
      typesUniques.includes(schemaType)
        ? actions.filter(
            (action) =>
              !["duplicate", "delete", "unpublish"].includes(
                (action as { action?: string }).action ?? ""
              )
          )
        : actions,
  },
  plugins: [
    structureTool({ name: "structure", title: "Contenu", structure: deskStructure }),
    planification(),
    visionTool({ name: "vision", title: "Requêtes", defaultApiVersion: apiVersion }),
  ],
});
