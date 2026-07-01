import type { StructureResolver } from "sanity/structure";

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Zinéma")
    .items([
      S.listItem()
        .title("Films")
        .child(S.documentTypeList("film").title("Films")),
      S.listItem()
        .title("Séances")
        .child(
          S.documentTypeList("screening")
            .title("Séances")
            .defaultOrdering([
              { field: "date", direction: "asc" },
              { field: "time", direction: "asc" },
            ])
        ),
      S.listItem()
        .title("Annonces")
        .child(S.documentTypeList("announcement").title("Annonces")),
      S.listItem()
        .title("Critiques")
        .child(S.documentTypeList("review").title("Critiques")),
      S.listItem()
        .title("Histoire")
        .child(
          S.documentTypeList("historyEntry")
            .title("Étapes d'histoire")
            .defaultOrdering([{ field: "order", direction: "asc" }])
        ),
      S.divider(),
      S.listItem()
        .title("Réglages du site")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings")
        ),
    ]);
