import { defineField, defineType } from "sanity";

export const review = defineType({
  name: "review",
  title: "Critique",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Citation",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Auteur·rice",
      type: "string",
    }),
    defineField({
      name: "source",
      title: "Média / publication",
      type: "string",
      description: "Ex. Le Temps, 24 heures, Le Courrier",
    }),
    defineField({
      name: "url",
      title: "Lien vers l'article",
      type: "url",
    }),
    defineField({
      name: "film",
      title: "Film concerné",
      type: "reference",
      to: [{ type: "film" }],
    }),
  ],
  preview: {
    select: { title: "quote", subtitle: "source" },
  },
});
