import type { StructureResolver, StructureBuilder } from "sanity/structure";
import {
  ArchiveIcon,
  BookIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PlayIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@sanity/icons";

import { idDeLaFiche } from "./schemaTypes/page";

/* ============================================================
   L'organisation du Studio, pensée dans l'ordre du travail réel
   d'un cinéma plutôt que dans l'ordre technique des données :

   1. La semaine en cours et les séances à venir — le quotidien.
   2. Les films, rangés par état (à l'affiche / bientôt / terminés).
   3. Les événements et les critiques.
   4. Les pages du site et les réglages, qu'on ne touche que
      rarement, tout en bas.

   Les listes filtrées évitent la principale source d'erreur : se
   tromper de fiche parce que tout est mélangé dans une seule liste.
   ============================================================ */

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dansNjours = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Zinéma")
    .items([
      /* ---------------- Ce qu'on modifie tous les jours ----------------
         Films et Séances en tête : c'est 90 % du travail. Chacun
         ouvre un sous-menu où les fiches sont déjà triées, pour ne
         jamais chercher dans une liste fourre-tout. */
      S.listItem()
        .title("Films")
        .icon(PlayIcon)
        .child(
          S.list()
            .title("Films")
            .items([
              S.listItem()
                .title("À l'affiche")
                .icon(PlayIcon)
                .child(
                  S.documentTypeList("film")
                    .title("À l'affiche")
                    .filter('_type == "film" && status == "a-laffiche"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .title("Bientôt")
                .icon(SparklesIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Avant-premières & prochainement")
                    .filter('_type == "film" && status in ["avant-premiere", "prochainement"]')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .title("Cycles & ciné-club")
                .icon(BookIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Cycles & ciné-club")
                    .filter('_type == "film" && status == "cycle"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .title("Terminés")
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Films terminés")
                    .filter('_type == "film" && status == "passe"')
                    .defaultOrdering([{ field: "year", direction: "desc" }])
                ),
              S.divider(),
              S.listItem()
                .title("Tous les films")
                .child(
                  S.documentTypeList("film")
                    .title("Tous les films")
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
            ])
        ),

      S.listItem()
        .title("Séances")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Séances")
            .items([
              S.listItem()
                .title("Les 7 prochains jours")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("screening")
                    .title("Séances des 7 prochains jours")
                    .filter('_type == "screening" && date >= $debut && date <= $fin')
                    .params({ debut: aujourdhui(), fin: dansNjours(7) })
                    .defaultOrdering([
                      { field: "date", direction: "asc" },
                      { field: "time", direction: "asc" },
                    ])
                ),
              S.listItem()
                .title("Toutes les séances à venir")
                .icon(ClockIcon)
                .child(
                  S.documentTypeList("screening")
                    .title("Séances à venir")
                    .filter('_type == "screening" && date >= $debut')
                    .params({ debut: aujourdhui() })
                    .defaultOrdering([
                      { field: "date", direction: "asc" },
                      { field: "time", direction: "asc" },
                    ])
                ),
              S.listItem()
                .title("Séances passées")
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList("screening")
                    .title("Séances passées")
                    .filter('_type == "screening" && date < $debut')
                    .params({ debut: aujourdhui() })
                    .defaultOrdering([
                      { field: "date", direction: "desc" },
                      { field: "time", direction: "desc" },
                    ])
                ),
              S.divider(),
              S.listItem()
                .title("Toutes les séances")
                .child(
                  S.documentTypeList("screening")
                    .title("Toutes les séances")
                    .defaultOrdering([
                      { field: "date", direction: "desc" },
                      { field: "time", direction: "desc" },
                    ])
                ),
            ])
        ),

      /* ---------------- Événements & presse ---------------- */
      S.listItem()
        .title("Événements")
        .icon(SparklesIcon)
        .child(
          S.list()
            .title("Événements")
            .items([
              S.listItem()
                .title("En cours & à venir")
                .child(
                  S.documentTypeList("evenement")
                    .title("En cours & à venir")
                    .filter(
                      '_type == "evenement" && (!defined(dateFin) || dateFin >= $today)'
                    )
                    .params({ today: aujourdhui() })
                    .defaultOrdering([{ field: "dateDebut", direction: "asc" }])
                ),
              S.listItem()
                .title("Terminés")
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList("evenement")
                    .title("Événements terminés")
                    .filter('_type == "evenement" && defined(dateFin) && dateFin < $today')
                    .params({ today: aujourdhui() })
                    .defaultOrdering([{ field: "dateDebut", direction: "desc" }])
                ),
            ])
        ),
      S.listItem()
        .title("Critiques presse")
        .icon(StarIcon)
        .child(S.documentTypeList("review").title("Critiques presse")),

      S.divider(),

      /* ---------------- Les pages du site ----------------
         Une entrée par page, dans l'ordre exact de la navigation
         du site : on retrouve la page qu'on a sous les yeux sans
         avoir à deviner où elle se range. */
      S.listItem()
        .title("Pages du site")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Pages du site")
            .items([
              fichePage(S, "home", "Accueil"),
              fichePage(S, "films", "Films"),
              fichePage(S, "agenda", "Agenda"),
              fichePage(S, "evenements", "Événements"),

              /* Deux pages ont, en plus de leurs textes, un contenu
                 propre : la frise pour Histoire, les formules pour
                 Abonnements. */
              S.listItem()
                .title("Histoire")
                .icon(BookIcon)
                .child(
                  S.list()
                    .title("Page Histoire")
                    .items([
                      fichePage(S, "histoire", "Textes de la page"),
                      S.listItem()
                        .title("Les étapes de la frise")
                        .icon(BookIcon)
                        .child(
                          S.documentTypeList("historyEntry")
                            .title("Étapes de la frise")
                            .defaultOrdering([{ field: "order", direction: "asc" }])
                        ),
                    ])
                ),
              S.listItem()
                .title("Abonnements")
                .icon(UsersIcon)
                .child(
                  S.list()
                    .title("Page Abonnements")
                    .items([
                      fichePage(S, "membership", "Textes de la page"),
                      S.listItem()
                        .title("Formules & paiement")
                        .icon(CreditCardIcon)
                        .child(
                          S.document()
                            .schemaType("abonnements")
                            .documentId("abonnements")
                            .title("Formules & paiement")
                        ),
                    ])
                ),

              fichePage(S, "contact", "Infos pratiques"),
            ])
        ),

      /* ---------------- Réglages ---------------- */
      S.listItem()
        .title("Réglages du cinéma")
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Réglages du cinéma")
        ),

      S.divider(),

      /* ---------------- Billetterie ---------------- */
      S.listItem()
        .title("Billets vendus")
        .icon(CreditCardIcon)
        .child(
          S.documentTypeList("commande")
            .title("Billets vendus")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        ),
    ]);

/* Une fiche de page : titre de l'onglet, introduction, message
   quand il n'y a rien, description pour Google. */
function fichePage(S: StructureBuilder, id: string, titre: string) {
  return S.listItem()
    .id(id)
    .title(titre)
    .icon(DocumentTextIcon)
    .child(S.document().schemaType("page").documentId(idDeLaFiche(id)).title(titre));
}
