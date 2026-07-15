import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  /** Adresse en ligne du Studio : https://zinema.sanity.studio */
  studioHost: "zinema",
});
