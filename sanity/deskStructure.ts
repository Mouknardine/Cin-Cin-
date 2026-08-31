import type { StructureResolver, StructureBuilder } from "sanity/structure";
import {
  ArchiveIcon,
  BookIcon,
  CalendarIcon,
  CogIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PlayIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@sanity/icons";

import { idDeLaFiche, PAGES } from "./schemaTypes/page";

/* ============================================================
   L'organisation du Studio.

   Deux règles, et rien d'autre :

   1. Chaque entrée porte le nom de la page du site où son contenu
      apparaît — Films, Agenda, Événement, Histoire, Membership,
      Contact. Aucun mot inventé.

   2. Une chose, un seul endroit. Pas de liste qui répète une autre
      liste, pas de raccourci qui rouvre une fiche déjà accessible
      ailleurs : c'est ce qui rend un Studio illisible.

   Les horaires d'un film ne sont donc PAS une rubrique : ils se
   règlent dans la fiche du film, où ils appartiennent.
   ============================================================ */

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Zinéma")
    .items([
      /* ---------------- Films ----------------
         Une seule liste : chaque ligne affiche déjà l'affiche, le
         titre, l'état du film et sa réalisation. Quatre sous-listes
         filtrées n'apprenaient rien de plus. */
      S.listItem()
        .id("films")
        .title("Films")
        .icon(PlayIcon)
        .child(
          S.documentTypeList("film")
            .title("Films")
            .defaultOrdering([{ field: "title", direction: "asc" }])
        ),

      /* ---------------- Agenda ----------------
         Séparé en deux parce qu'il y en a beaucoup, et qu'on ne
         travaille jamais sur les séances passées. */
      S.listItem()
        .id("agenda")
        .title("Agenda")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Agenda")
            .items([
              S.listItem()
                .id("agenda-a-venir")
                .title("Séances à venir")
                .icon(CalendarIcon)
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
                .id("agenda-passees")
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
            ])
        ),

      /* ---------------- Événement ---------------- */
      S.listItem()
        .id("evenements")
        .title("Événement")
        .icon(SparklesIcon)
        .child(
          S.documentTypeList("evenement")
            .title("Événement")
            .defaultOrdering([{ field: "dateDebut", direction: "desc" }])
        ),

      /* ---------------- Histoire ---------------- */
      S.listItem()
        .id("histoire")
        .title("Histoire")
        .icon(BookIcon)
        .child(
          S.documentTypeList("historyEntry")
            .title("Les étapes de la frise")
            .defaultOrdering([{ field: "order", direction: "asc" }])
        ),

      /* ---------------- Membership ---------------- */
      S.listItem()
        .id("membership")
        .title("Membership")
        .icon(UsersIcon)
        .child(
          S.document()
            .schemaType("abonnements")
            .documentId("abonnements")
            .title("Formules et paiement")
        ),

      /* ---------------- Citations de presse ----------------
         Elles s'affichent sur la fiche d'un film. On peut les créer
         depuis le film ; cette entrée sert à les retrouver ensuite. */
      S.listItem()
        .id("citations")
        .title("Citations de presse")
        .icon(StarIcon)
        .child(S.documentTypeList("review").title("Citations de presse")),

      S.divider(),

      /* ---------------- Les textes des pages ----------------
         Une fiche par page du site, dans l'ordre de la navigation :
         titre de l'onglet, paragraphe d'introduction, message quand
         la page n'a rien à montrer, description pour Google. */
      S.listItem()
        .id("textes")
        .title("Textes des pages")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Textes des pages")
            .items(
              PAGES.map((p) =>
                S.listItem()
                  .id(`texte-${p.id}`)
                  .title(p.titre)
                  .icon(DocumentTextIcon)
                  .child(
                    S.document()
                      .schemaType("page")
                      .documentId(idDeLaFiche(p.id))
                      .title(p.titre)
                  )
              ) as ReturnType<StructureBuilder["listItem"]>[]
            )
        ),

      /* ---------------- Réglages ----------------
         Adresse, horaires, téléphones, e-mails, tarifs, salles,
         logo, réseaux sociaux. Un seul endroit, atteint d'un seul
         chemin. */
      S.listItem()
        .id("reglages")
        .title("Réglages du cinéma")
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Réglages du cinéma")
        ),

      S.listItem()
        .id("billets")
        .title("Billets vendus")
        .icon(CreditCardIcon)
        .child(
          S.documentTypeList("commande")
            .title("Billets vendus")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        ),
    ]);
