import type { StructureResolver, StructureBuilder } from "sanity/structure";
import {
  ArchiveIcon,
  BookIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HomeIcon,
  PlayIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@sanity/icons";

import { idDeLaFiche } from "./schemaTypes/page";

/* ============================================================
   L'organisation du Studio suit EXACTEMENT le site.

   Le menu de gauche reprend, dans l'ordre, la page d'accueil puis
   les six rubriques de la barre de navigation du site : Films,
   Agenda, Événement, Histoire, Membership, Contact. Aucun mot
   inventé : ce qu'on lit ici, on le lit aussi sur le site.

   Chaque rubrique contient tout ce qui alimente la page
   correspondante, y compris son texte. On ne cherche donc jamais
   « où ça se règle » : on ouvre la page qu'on a sous les yeux.
   ============================================================ */

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** Le texte d'une page (titre d'onglet, introduction, message vide, Google). */
function texteDeLaPage(S: StructureBuilder, id: string, titre = "Texte de la page") {
  return S.listItem()
    .id(`texte-${id}`)
    .title(titre)
    .icon(DocumentTextIcon)
    .child(S.document().schemaType("page").documentId(idDeLaFiche(id)).title(titre));
}

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Zinéma")
    .items([
      /* ---------------- Page d'accueil ---------------- */
      S.listItem()
        .id("accueil")
        .title("Page d'accueil")
        .icon(HomeIcon)
        .child(
          S.list()
            .title("Page d'accueil")
            .items([
              texteDeLaPage(S, "home"),
              S.listItem()
                .id("accueil-films")
                .title("Les films du mur d'affiches")
                .icon(PlayIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Films affichés sur l'accueil")
                    .filter('_type == "film" && status != "passe"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
            ])
        ),

      /* ---------------- Films ---------------- */
      S.listItem()
        .id("films")
        .title("Films")
        .icon(PlayIcon)
        .child(
          S.list()
            .title("Films")
            .items([
              /* Les quatre premiers correspondent aux quatre onglets
                 qu'un visiteur voit en haut de la page Films. */
              S.listItem()
                .id("films-a-laffiche")
                .title("À l'affiche")
                .icon(PlayIcon)
                .child(
                  S.documentTypeList("film")
                    .title("À l'affiche")
                    .filter('_type == "film" && status == "a-laffiche"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .id("films-premiere")
                .title("Première")
                .icon(SparklesIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Première")
                    .filter('_type == "film" && status == "avant-premiere"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .id("films-prochainement")
                .title("Prochainement")
                .icon(ClockIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Prochainement")
                    .filter('_type == "film" && status == "prochainement"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .id("films-cycles")
                .title("Cycles")
                .icon(BookIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Cycles")
                    .filter('_type == "film" && status == "cycle"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.divider(),
              S.listItem()
                .id("films-termines")
                .title("Films retirés du site")
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList("film")
                    .title("Films retirés du site")
                    .filter('_type == "film" && status == "passe"')
                    .defaultOrdering([{ field: "year", direction: "desc" }])
                ),
              S.listItem()
                .id("films-tous")
                .title("Tous les films")
                .child(
                  S.documentTypeList("film")
                    .title("Tous les films")
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
              S.listItem()
                .id("films-critiques")
                .title("Citations de presse")
                .icon(StarIcon)
                .child(S.documentTypeList("review").title("Citations de presse")),
              S.divider(),
              texteDeLaPage(S, "films"),
            ])
        ),

      /* ---------------- Agenda ---------------- */
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
              S.divider(),
              texteDeLaPage(S, "agenda"),
            ])
        ),

      /* ---------------- Événement ---------------- */
      S.listItem()
        .id("evenements")
        .title("Événement")
        .icon(SparklesIcon)
        .child(
          S.list()
            .title("Événement")
            .items([
              S.listItem()
                .id("evenements-en-cours")
                .title("En cours et à venir")
                .icon(SparklesIcon)
                .child(
                  S.documentTypeList("evenement")
                    .title("En cours et à venir")
                    .filter('_type == "evenement" && (!defined(dateFin) || dateFin >= $today)')
                    .params({ today: aujourdhui() })
                    .defaultOrdering([{ field: "dateDebut", direction: "asc" }])
                ),
              S.listItem()
                .id("evenements-termines")
                .title("Terminés")
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList("evenement")
                    .title("Événements terminés")
                    .filter('_type == "evenement" && defined(dateFin) && dateFin < $today')
                    .params({ today: aujourdhui() })
                    .defaultOrdering([{ field: "dateDebut", direction: "desc" }])
                ),
              S.divider(),
              texteDeLaPage(S, "evenements"),
            ])
        ),

      /* ---------------- Histoire ---------------- */
      S.listItem()
        .id("histoire")
        .title("Histoire")
        .icon(BookIcon)
        .child(
          S.list()
            .title("Histoire")
            .items([
              S.listItem()
                .id("histoire-frise")
                .title("Les étapes de la frise")
                .icon(BookIcon)
                .child(
                  S.documentTypeList("historyEntry")
                    .title("Les étapes de la frise")
                    .defaultOrdering([{ field: "order", direction: "asc" }])
                ),
              S.divider(),
              texteDeLaPage(S, "histoire", "Texte de la page (le grand paragraphe)"),
            ])
        ),

      /* ---------------- Membership ---------------- */
      S.listItem()
        .id("membership")
        .title("Membership")
        .icon(UsersIcon)
        .child(
          S.list()
            .title("Membership")
            .items([
              S.listItem()
                .id("membership-formules")
                .title("Formules et paiement")
                .icon(CreditCardIcon)
                .child(
                  S.document()
                    .schemaType("abonnements")
                    .documentId("abonnements")
                    .title("Formules et paiement")
                ),
              S.listItem()
                .id("membership-tarifs")
                .title("Les deux tarifs du cinéma")
                .icon(CogIcon)
                .child(
                  S.document()
                    .schemaType("siteSettings")
                    .documentId("siteSettings")
                    .title("Réglages du cinéma")
                ),
              S.divider(),
              texteDeLaPage(S, "membership"),
            ])
        ),

      /* ---------------- Contact ---------------- */
      S.listItem()
        .id("contact")
        .title("Contact")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Contact")
            .items([
              S.listItem()
                .id("contact-infos")
                .title("Adresse, horaires, téléphones")
                .icon(CogIcon)
                .child(
                  S.document()
                    .schemaType("siteSettings")
                    .documentId("siteSettings")
                    .title("Réglages du cinéma")
                ),
              S.divider(),
              texteDeLaPage(S, "contact"),
            ])
        ),

      S.divider(),

      /* ---------------- Le reste, qu'on ouvre rarement ---------------- */
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
