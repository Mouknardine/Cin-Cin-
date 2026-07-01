import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId, useCdn } from "@/sanity/env";

export const isSanityConfigured = Boolean(projectId);

export const client = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn, perspective: "published" })
  : null;
