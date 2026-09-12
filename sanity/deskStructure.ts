import type { StructureResolver } from "sanity/structure";
import {
  ArchiveIcon,
  BookIcon,
  CalendarIcon,
  CogIcon,
  CreditCardIcon,
  HomeIcon,
  PlayIcon,
  SparklesIcon,
  UsersIcon,
} from "@sanity/icons";

/* ============================================================
   L'organisation du Studio.

   Deux règles, et rien d'autre :

   1. Chaque entrée porte le nom de la page du site où son contenu
      apparaît — Films, Agenda, Événements, Location, Histoire,
      Membership, Infos. Aucun mot inventé. « Cinémas » fait
      exception : cette fiche alimente la page Infos de chaque
      cinéma, et il y en a autant que de cinémas.

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

      /* ---------------- Événements ---------------- */
      S.listItem()
        .id("evenements")
        .title("Événements")
        .icon(SparklesIcon)
        .child(
          S.documentTypeList("evenement")
            .title("Événements")
            .defaultOrdering([{ field: "dateDebut", direction: "desc" }])
        ),

      /* ---------------- Location ----------------
         Les espaces qu'on peut louer, et l'adresse qui reçoit les
         demandes envoyées depuis le site. Une seule fiche. */
      S.listItem()
        .id("location")
        .title("Location")
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType("location")
            .documentId("location")
            .title("Location des espaces")
        ),

      /* ---------------- Histoire ----------------
         La frise n'est plus dans le menu du site : on y entre par
         une case de la page Infos. Elle se modifie ici, dans une
         seule fiche — la phrase d'accueil et les étapes, dans
         l'ordre où la page se lit. */
      S.listItem()
        .id("histoire")
        .title("Histoire")
        .icon(BookIcon)
        .child(
          S.document()
            .schemaType("histoire")
            .documentId("histoire")
            .title("Histoire")
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

      S.divider(),

      /* ---------------- Cinémas ----------------
         Une fiche par cinéma : son adresse, ses horaires, ses
         téléphones, ses e-mails, ses tarifs, ses salles, ses
         réseaux sociaux.

         Les films, eux, sont communs : ils sont saisis une fois et
         apparaissent partout où ils sont programmés. C'est la
         séance qui dit dans quel cinéma un film passe. */
      S.listItem()
        .id("cinemas")
        .title("Cinémas")
        .icon(CogIcon)
        .child(
          S.documentTypeList("siteSettings")
            .title("Cinémas")
            .defaultOrdering([{ field: "nom", direction: "asc" }])
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
