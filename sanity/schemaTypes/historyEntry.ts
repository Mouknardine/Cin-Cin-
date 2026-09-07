import { defineField, defineType } from "sanity";

/* ============================================================
   Une étape de la frise chronologique de la page Histoire.
   Les étapes s'affichent dans l'ordre du numéro de position.
   ============================================================ */

export const historyEntry = defineType({
  name: "historyEntry",
  title: "Étape de la frise",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Position dans la frise",
      type: "number",
      description:
        "1 pour la première étape, 2 pour la suivante, etc. Laissez des trous (10, 20, 30…) si vous pensez insérer des étapes plus tard.",
      validation: (Rule) =>
        Rule.required().min(1).error("Donnez un numéro de position (1, 2, 3…)."),
    }),
    defineField({
      name: "year",
      title: "Année ou période",
      type: "string",
      description: "Ex. 2001, ou 2010–2012.",
      validation: (Rule) => Rule.required().error("Indiquez l'année."),
    }),
    defineField({
      name: "title",
      title: "Titre de l'étape",
      type: "string",
      description: "Quelques mots. Ex. « Ouverture de la salle ».",
      validation: (Rule) => Rule.required().error("Donnez un titre à l'étape."),
    }),
    defineField({
      name: "body",
      title: "Texte",
      type: "array",
      of: [{ type: "block" }],
      description: "Deux à cinq phrases racontant ce qui s'est passé cette année-là.",
    }),
    defineField({
      name: "image",
      title: "Photo d'archive",
      type: "imageZinema",
      description:
        "Facultatif : une photo de cette époque, affichée à côté du texte sur la page Histoire.",
    }),
  ],
  orderings: [
    {
      title: "Ordre de la frise",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", year: "year", order: "order", media: "image" },
    prepare({ title, year, order, media }) {
      return {
        title: `${year || "?"} — ${title || "Étape sans titre"}`,
        subtitle: `Position ${order ?? "?"}`,
        media,
      };
    },
  },
});
