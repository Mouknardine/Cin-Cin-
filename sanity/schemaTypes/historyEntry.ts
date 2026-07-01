import { defineField, defineType } from "sanity";

export const historyEntry = defineType({
  name: "historyEntry",
  title: "Étape d'histoire",
  type: "document",
  fields: [
    defineField({
      name: "year",
      title: "Année / période",
      type: "string",
      description: "Ex. 2001, ou 2010–2012",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Texte",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      title: "Ordre",
      type: "number",
      description: "Les étapes sont triées par ordre croissant.",
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Chronologie",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "year" },
  },
});
