import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { deskStructure } from "./sanity/deskStructure";

// Ce fichier est chargé par la CLI Sanity ("npm run studio:dev" /
// "studio:deploy"), un outil séparé (Vite) du site Next.js exporté en
// statique. D'où le préfixe SANITY_STUDIO_ (convention Sanity) plutôt que
// NEXT_PUBLIC_ utilisé côté site — même valeur, deux variables à définir
// dans .env.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2024-06-01";

export default defineConfig({
  name: "zinema",
  title: "Zinéma — Studio",
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
