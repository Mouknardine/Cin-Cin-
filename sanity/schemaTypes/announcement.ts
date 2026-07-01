import { defineField, defineType } from "sanity";

export const announcement = defineType({
  name: "announcement",
  title: "Annonce",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        list: [
          { title: "Nouveauté", value: "nouveaute" },
          { title: "Évènement", value: "evenement" },
          { title: "Cycle", value: "cycle" },
          { title: "Brunch", value: "brunch" },
          { title: "Info spéciale", value: "info" },
        ],
      },
      initialValue: "info",
    }),
    defineField({
      name: "date",
      title: "Date de publication",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "excerpt",
      title: "Chapô / résumé",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "body",
      title: "Texte",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "linkUrl",
      title: "Lien externe (optionnel)",
      type: "url",
    }),
    defineField({
      name: "pinned",
      title: "Épingler en haut",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Date, récent d'abord",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "category", media: "image" },
  },
});
