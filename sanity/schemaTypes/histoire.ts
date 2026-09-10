import { defineArrayMember, defineField, defineType } from "sanity";

/* ============================================================
   La page Histoire, en une seule fiche.

   Auparavant chaque étape de la frise était un document à part,
   avec un numéro de position à tenir à jour, et la phrase
   d'accueil vivait encore ailleurs. Trois endroits pour une page
   de deux paragraphes : personne ne s'y retrouvait.

   Ici, tout est au même endroit, dans l'ordre où la page se lit.
   Les étapes se rangent en les glissant : plus aucun numéro à
   gérer.
   ============================================================ */

export const histoire = defineType({
  name: "histoire",
  title: "Histoire",
  type: "document",
  fields: [
    defineField({
      name: "intro",
      title: "Phrase d'accueil",
      type: "text",
      rows: 3,
      description:
        "Le texte en haut de la page, avant la frise. Une ou deux phrases : ce qu'est le Zinéma, et depuis quand.",
      validation: (Rule) =>
        Rule.max(400).warning("Au-delà de ~400 signes, la phrase d'accueil cesse d'être lue."),
    }),
    defineField({
      name: "etapes",
      title: "Les étapes de la frise",
      type: "array",
      description:
        "Les moments de l'histoire du cinéma, du plus ancien au plus récent. Glissez une étape pour la déplacer.",
      of: [
        defineArrayMember({
          type: "object",
          name: "etape",
          title: "Étape",
          fields: [
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
                "Facultatif : une photo de cette époque, affichée à côté du texte sur la page.",
            }),
          ],
          preview: {
            select: { title: "title", year: "year", media: "image" },
            prepare({ title, year, media }) {
              return {
                title: `${year || "?"} — ${title || "Étape sans titre"}`,
                media,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { etapes: "etapes" },
    prepare({ etapes }) {
      const nombre = Array.isArray(etapes) ? etapes.length : 0;
      return {
        title: "Histoire",
        subtitle: nombre ? `${nombre} étape${nombre > 1 ? "s" : ""}` : "Aucune étape",
      };
    },
  },
});
