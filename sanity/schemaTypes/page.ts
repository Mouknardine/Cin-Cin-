import { defineField, defineType } from "sanity";

/* ============================================================
   Les textes propres à UNE page du site.

   Il existe une fiche par page (Accueil, Films, Agenda,
   Événements, Histoire, Abonnements, Infos pratiques), rangée
   dans « Pages du site » — le menu y suit exactement l'ordre de
   la navigation du site, pour qu'on trouve la page qu'on a sous
   les yeux sans réfléchir.

   Le contenu de la page (les films, les séances, les événements)
   vient d'ailleurs : ici on règle uniquement ce qui entoure ce
   contenu — le titre, le paragraphe d'introduction, le message
   affiché quand il n'y a rien, et la ligne qui apparaît dans
   Google.
   ============================================================ */

/** Les pages du site, dans l'ordre de la navigation. */
export const PAGES = [
  { id: "home", titre: "Accueil", chemin: "/" },
  { id: "films", titre: "Films", chemin: "/films/" },
  { id: "agenda", titre: "Agenda", chemin: "/agenda/" },
  { id: "evenements", titre: "Événements", chemin: "/evenements/" },
  { id: "histoire", titre: "Histoire", chemin: "/histoire/" },
  { id: "membership", titre: "Abonnements", chemin: "/membership/" },
  { id: "contact", titre: "Infos pratiques", chemin: "/contact/" },
] as const;

export const idDeLaFiche = (id: string) => `page-${id}`;

const NOMS: Record<string, string> = Object.fromEntries(
  PAGES.map((p) => [p.id, p.titre])
);

export const page = defineType({
  name: "page",
  title: "Page du site",
  type: "document",
  fields: [
    defineField({
      name: "pageId",
      title: "Page concernée",
      type: "string",
      description:
        "Identifie la page. Ne se modifie pas : chaque fiche correspond à une page précise du site.",
      readOnly: true,
      options: { list: PAGES.map((p) => ({ title: p.titre, value: p.id })) },
    }),
    defineField({
      name: "titre",
      title: "Titre de la page",
      type: "string",
      description:
        "Ce titre ne s'affiche pas sur la page elle-même : c'est celui de l'onglet du navigateur, celui du signet, et le titre bleu cliquable dans les résultats Google. Ex. « Agenda — Zinéma ».",
      validation: (Rule) =>
        Rule.required()
          .max(70)
          .error("Le titre est obligatoire (70 signes maximum, sinon Google le coupe)."),
    }),
    defineField({
      name: "intro",
      title: "Paragraphe d'introduction",
      type: "text",
      rows: 4,
      description:
        "Le texte affiché tout en haut de la page, au-dessus du contenu. Laissez vide si la page doit s'ouvrir directement sur son contenu — c'est le cas aujourd'hui pour la plupart des pages.",
    }),
    defineField({
      name: "seoDescription",
      title: "Description pour Google",
      type: "text",
      rows: 3,
      description:
        "Le petit texte gris sous le titre, dans les résultats de recherche. Entre 120 et 160 signes. Dites concrètement ce qu'on trouve sur cette page.",
      validation: (Rule) =>
        Rule.max(180).warning("Au-delà de 180 signes, Google coupe la phrase."),
    }),
  ],
  preview: {
    select: { pageId: "pageId", titre: "titre" },
    prepare({ pageId, titre }) {
      return {
        title: NOMS[pageId as string] || "Page du site",
        subtitle: titre || undefined,
      };
    },
  },
});
